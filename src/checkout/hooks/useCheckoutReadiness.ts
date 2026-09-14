import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocale } from "next-intl";
import { useClient } from "urql";
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
// checks the fields checkoutComplete will later require. It does NOT fix the
// saves themselves (that's Phase 2); it only refuses to move on without them.

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
	| { status: "error" }
	| { status: "cancelled" };

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
}

const POLL_INTERVAL_MS = 700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
		const result = await client
			.query<CheckoutQuery, CheckoutQueryVariables>(
				CheckoutDocument,
				{ id: checkoutId, languageCode: getCheckoutLanguageCode(locale) },
				{ requestPolicy: "network-only" },
			)
			.toPromise();

		if (result.error) {
			throw result.error;
		}

		return (result.data?.checkout ?? null) as CheckoutFragment | null;
	}, [checkoutId, client, locale]);

	const verify = useCallback(
		async (
			stage: ReadinessStage,
			{ settleMs = 0, maxMs = 7000, followOnSavesMounted = false }: VerifyOptions = {},
		): Promise<ReadinessResult> => {
			const startedAt = Date.now();

			for (;;) {
				let result: ReadinessResult;

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
					result = { status: "error" };
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
					return result;
				}

				await sleep(POLL_INTERVAL_MS);

				if (unmountedRef.current) {
					return { status: "cancelled" };
				}
			}
		},
		[fetchFreshCheckout],
	);

	return { verify };
};
