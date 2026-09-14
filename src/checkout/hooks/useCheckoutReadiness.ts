import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocale } from "next-intl";
import { CombinedError, useClient } from "urql";
import {
	CheckoutDocument,
	type CheckoutFragment,
	type CheckoutQuery,
	type CheckoutQueryVariables,
} from "@/checkout/graphql";
import { getCheckoutLanguageCode, type getCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { areAnyRequestsInProgress, useCheckoutUpdateState } from "@/checkout/state/updateStateStore";

// Phase 1 of front_store-9ze: the wizard's field saves are fire-and-forget
// (debounced, and canceled when a step unmounts), so what the UI shows is not
// proof of what Saleor has. Before advancing a step — and before any payment
// gateway mounts — this re-reads the checkout straight from the network and
// checks the fields checkoutComplete will later require. Phase 2 (front_store-bwh)
// makes the saves themselves reliable (commit-on-advance, useStepCommit.ts);
// this check stays as the backstop.
//
// Fail-open contract for callers: only "notReady" and "checkoutGone" are
// definitive and may block. "error" means the check itself couldn't complete
// (network, timeout, GraphQL error) and callers must let the customer through,
// same policy as the phone-status gate — a broken check must never be able to
// take checkout down.

export type ReadinessStage = "contact" | "payment";

export type ReadinessProblem =
	| "email"
	| "shippingAddress"
	| "streetAddress"
	| "emirate"
	| "billingAddress"
	| "deliveryMethod";

export type ReadinessResult =
	| { status: "ready"; checkout: CheckoutFragment }
	| { status: "notReady"; checkout: CheckoutFragment; problems: ReadinessProblem[] }
	// checkout(id:) returned null — already converted into an order (or never existed)
	| { status: "checkoutGone" }
	| ({ status: "error" } & ReadinessFailure)
	| { status: "cancelled" };

// Why the check itself couldn't complete (the last failure seen before giving up).
export type ReadinessFailureReason = "timeout" | "network" | "http" | "graphql" | "unknown";

export interface ReadinessFailure {
	reason: ReadinessFailureReason;
	message: string;
	attempts: number;
	elapsedMs: number;
}

// Stable prefix so fail-open events can be found in browser logs / log
// collectors. One record per actual fail-open, never per retry attempt.
export const READINESS_FAIL_OPEN_LOG_PREFIX = "[checkout-readiness:fail-open]";

export const reportReadinessFailOpen = (
	failure: ReadinessFailure & {
		stage: ReadinessStage;
		checkoutId: string;
		source: "step-advance" | "payment-guard";
	},
) => {
	// Synchronous and exception-proof: must never block or delay the customer.
	try {
		console.error(READINESS_FAIL_OPEN_LOG_PREFIX, failure);
	} catch {
		// ignore
	}
};

class ReadinessTimeoutError extends Error {}

const classifyFailure = (error: unknown): Pick<ReadinessFailure, "reason" | "message"> => {
	const message = error instanceof Error ? error.message : String(error);

	if (error instanceof ReadinessTimeoutError) {
		return { reason: "timeout", message };
	}
	if (error instanceof CombinedError) {
		if (error.graphQLErrors.length) {
			return { reason: "graphql", message };
		}
		const status = (error.response as { status?: number } | undefined)?.status;
		return { reason: typeof status === "number" && status >= 400 ? "http" : "network", message };
	}
	return { reason: "unknown", message };
};

interface VerifyOptions {
	// Keep re-checking at least this long after the first failed check. Clicking
	// Continue blurs the focused field, which restarts that form's 2s debounced
	// save — a check at t=0 would reject a save that is about to land.
	settleMs?: number;
	// Hard ceiling on re-checking while saves still look in flight.
	maxMs?: number;
	// Whether the Shipping step's forms are still mounted, so their automatic
	// follow-on saves (billing mirrors shipping, cheapest delivery method is
	// auto-selected once methods exist) can still land on their own.
	followOnSavesMounted?: boolean;
	// When the check can't complete, the hook records the fail-open itself
	// (as "payment-guard", which always fails open). goNext passes false and
	// records it only if it actually advances — a failed save still blocks there.
	reportFailOpen?: boolean;
}

const POLL_INTERVAL_MS = 700;
const REQUEST_TIMEOUT_MS = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rejects if `promise` hasn't settled within `ms`, so no single await in the
// readiness loop can outlive its own bound.
const withTimeout = <T>(promise: Promise<T>, ms: number) => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new ReadinessTimeoutError(`Checkout readiness check timed out after ${ms}ms`)),
			ms,
		);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export const getReadinessProblems = (
	checkout: CheckoutFragment,
	stage: ReadinessStage,
): ReadinessProblem[] => {
	const problems: ReadinessProblem[] = [];

	// checkoutComplete validates email before anything else, so it's required
	// for the payment stage too — not only when leaving Contact.
	if (!checkout.email?.trim()) {
		problems.push("email");
	}

	if (stage === "contact") {
		return problems;
	}

	if (checkout.isShippingRequired) {
		const { shippingAddress } = checkout;

		if (!shippingAddress) {
			problems.push("shippingAddress");
		} else {
			if (!shippingAddress.streetAddress1?.trim()) {
				problems.push("streetAddress");
			}
			if (!shippingAddress.countryArea?.trim()) {
				problems.push("emirate");
			}
		}
	}

	if (!checkout.billingAddress) {
		problems.push("billingAddress");
	}

	if (checkout.isShippingRequired) {
		const deliveryMethodId = checkout.deliveryMethod?.id;

		if (!deliveryMethodId || !checkout.shippingMethods.some(({ id }) => id === deliveryMethodId)) {
			problems.push("deliveryMethod");
		}
	}

	return problems;
};

// Problems the still-mounted Shipping forms resolve by themselves without any
// further customer input, once the save they depend on has landed.
const canStillSettleOnItsOwn = (problems: ReadinessProblem[], checkout: CheckoutFragment) =>
	problems.every(
		(problem) =>
			(problem === "deliveryMethod" && checkout.shippingMethods.length > 0) ||
			(problem === "billingAddress" && !!checkout.shippingAddress),
	);

export const getReadinessMessage = (
	result: ReadinessResult,
	messages: ReturnType<typeof getCheckoutMessages>["readiness"],
) => {
	if (result.status === "checkoutGone") {
		return messages.checkoutGone;
	}

	if (result.status === "notReady") {
		// Without a saved shipping address there are no shipping methods to pick
		// and nothing for billing to mirror, so those two are only consequences —
		// naming them would bury the one thing the customer actually has to fix.
		const actionable = result.problems.includes("shippingAddress")
			? result.problems.filter((problem) => problem !== "billingAddress" && problem !== "deliveryMethod")
			: result.problems;

		return actionable.map((problem) => messages[problem]).join(" ");
	}
	return messages.verifyFailed;
};

// Earliest wizard step that can fix at least one of the problems.
export const getStepForProblems = (problems: ReadinessProblem[]): "contact" | "shipping" =>
	problems.includes("email") ? "contact" : "shipping";

export const useCheckoutReadiness = () => {
	const client = useClient();
	const locale = useLocale();
	const checkoutId = useMemo(() => extractCheckoutIdFromUrl(), []);

	const updateState = useCheckoutUpdateState();
	const updateStateRef = useRef(updateState);
	updateStateRef.current = updateState;

	const unmountedRef = useRef(false);
	useEffect(() => {
		unmountedRef.current = false;
		return () => {
			unmountedRef.current = true;
		};
	}, []);

	// network-only bypasses urql's document cache for this request; the result
	// is still written back under the same operation key, so every mounted
	// useCheckout() re-renders with the fresh server state too.
	const fetchFreshCheckout = useCallback(async () => {
		const result = await withTimeout(
			client
				.query<CheckoutQuery, CheckoutQueryVariables>(
					CheckoutDocument,
					{ id: checkoutId, languageCode: getCheckoutLanguageCode(locale) },
					{ requestPolicy: "network-only" },
				)
				.toPromise(),
			REQUEST_TIMEOUT_MS,
		);

		if (result.error) {
			throw result.error;
		}

		return (result.data?.checkout ?? null) as CheckoutFragment | null;
	}, [checkoutId, client, locale]);

	const verify = useCallback(
		async (
			stage: ReadinessStage,
			{ settleMs = 0, maxMs = 7000, followOnSavesMounted = false, reportFailOpen = true }: VerifyOptions = {},
		): Promise<ReadinessResult> => {
			const startedAt = Date.now();
			let attempts = 0;

			for (;;) {
				let result: ReadinessResult;
				attempts += 1;

				try {
					const checkout = await fetchFreshCheckout();

					if (!checkout) {
						return { status: "checkoutGone" };
					}

					const problems = getReadinessProblems(checkout, stage);
					result = problems.length
						? { status: "notReady", checkout, problems }
						: { status: "ready", checkout };
				} catch (error) {
					console.error("Checkout readiness check failed:", error);
					result = {
						status: "error",
						...classifyFailure(error),
						attempts,
						elapsedMs: Date.now() - startedAt,
					};
				}

				if (unmountedRef.current) {
					return { status: "cancelled" };
				}

				if (result.status === "ready") {
					return result;
				}

				const elapsed = Date.now() - startedAt;
				const savesInFlight = areAnyRequestsInProgress(updateStateRef.current);
				const settlingOnItsOwn =
					followOnSavesMounted &&
					result.status === "notReady" &&
					canStillSettleOnItsOwn(result.problems, result.checkout);

				// Bounded either way: never longer than maxMs, so a scope stuck at
				// "loading" (a save canceled by an earlier unmount) can't hang this.
				const keepWaiting = elapsed < settleMs || ((savesInFlight || settlingOnItsOwn) && elapsed < maxMs);

				if (!keepWaiting) {
					if (result.status === "error" && reportFailOpen) {
						const { reason, message } = result;
						reportReadinessFailOpen({
							reason,
							message,
							attempts,
							elapsedMs: elapsed,
							stage,
							checkoutId,
							source: "payment-guard",
						});
					}
					return result;
				}

				await sleep(POLL_INTERVAL_MS);

				if (unmountedRef.current) {
					return { status: "cancelled" };
				}
			}
		},
		[checkoutId, fetchFreshCheckout],
	);

	return { verify, checkoutId };
};
