import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocale } from "next-intl";
import { CombinedError, type TypedDocumentNode, useClient } from "urql";
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

// Fields of the checkout neither verify() nor its callers read. Saleor answers
// a field the requester may not see with that field nulled plus a GraphQL
// error on its path, while the rest of the checkout comes back intact — e.g.
// Checkout.user for anyone but the checkout's owner, which is every signed-out
// visitor on a checkout attached at an earlier sign-in (front_store-2rt). Such
// a result is still a complete answer to the readiness question. Anything
// else — an error without a path, on the checkout itself or on a field read
// here, or a missing checkout — stays fatal.
const TOLERATED_ERROR_PATHS: ReadonlyArray<ReadonlyArray<string>> = [["checkout", "user"]];

const isToleratedErrorPath = (path: ReadonlyArray<string | number> | undefined) =>
	!!path &&
	TOLERATED_ERROR_PATHS.some(
		(tolerated) =>
			path.length >= tolerated.length && tolerated.every((segment, index) => path[index] === segment),
	);

const isToleratedPartialError = (error: CombinedError) =>
	!error.networkError &&
	error.graphQLErrors.length > 0 &&
	error.graphQLErrors.every(({ path }) => isToleratedErrorPath(path));

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
	// Epoch ms after which no request is started or waited on. Defaults to a
	// fresh READINESS_BUDGET_MS; goNext passes the one started at the Continue
	// click, and the Payment guard reuses it.
	deadline?: number;
}

const POLL_INTERVAL_MS = 700;

// Total time the customer can be kept waiting by one Continue click: the step's
// commits, the step check and the Payment guard all draw on this one budget.
export const READINESS_BUDGET_MS = 8000;

export const createReadinessDeadline = () => Date.now() + READINESS_BUDGET_MS;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The page's useCheckout() and this check must not share an urql operation key:
// urql keeps one result stream per key, so a failed re-read would replace the
// page's checkout data with the error and Checkout.tsx would render "not found"
// (front_store-auc). The key hashes the operation name, so this is
// CheckoutDocument — same variables, same generated selection — under its own
// name. A new document object with only `kind` and `definitions`: spreading
// CheckoutDocument would copy its `loc` (source text naming the old operation)
// and urql's cached `__key`, and carry the old key over.
const CheckoutReadinessDocument: TypedDocumentNode<CheckoutQuery, CheckoutQueryVariables> = {
	kind: CheckoutDocument.kind,
	definitions: CheckoutDocument.definitions.map((definition) =>
		"operation" in definition && definition.name
			? { ...definition, name: { ...definition.name, value: "CheckoutReadiness" } }
			: definition,
	),
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

	// network-only bypasses urql's document cache, so this always reads what
	// Saleor has now. It deliberately doesn't refresh the page's checkout data:
	// the page is kept current by the refetch urql runs after every save.
	//
	// Subscribed rather than awaited via toPromise(): on timeout the subscription
	// is ended, which tears the operation down (and aborts its fetch). A timed-out
	// toPromise() leaves the operation active, and urql then attaches every later
	// check with the same key to that dead request instead of sending a new one.
	const fetchFreshCheckout = useCallback(
		(timeoutMs: number) =>
			new Promise<CheckoutFragment | null>((resolve, reject) => {
				let settled = false;
				let onTimeout = () => {};
				const timer = setTimeout(() => onTimeout(), timeoutMs);

				const subscription = client
					.query<CheckoutQuery, CheckoutQueryVariables>(
						CheckoutReadinessDocument,
						{ id: checkoutId, languageCode: getCheckoutLanguageCode(locale) },
						{ requestPolicy: "network-only" },
					)
					.subscribe((result) => {
						// Same filter toPromise() applies.
						if (settled || result.stale || result.hasNext) {
							return;
						}
						settled = true;
						clearTimeout(timer);
						// End the operation once answered, as toPromise() does. Deferred: a
						// result can arrive before `subscription` is assigned.
						queueMicrotask(() => subscription.unsubscribe());

						const checkout = (result.data?.checkout ?? null) as CheckoutFragment | null;

						if (result.error && !(checkout && isToleratedPartialError(result.error))) {
							reject(result.error);
							return;
						}
						if (result.error) {
							console.debug("[checkout-readiness] ignored errors on fields the check doesn't read:", {
								paths: result.error.graphQLErrors.map(({ path }) => path?.join(".")),
							});
						}
						resolve(checkout);
					});

				onTimeout = () => {
					if (settled) {
						return;
					}
					settled = true;
					subscription.unsubscribe();
					reject(new ReadinessTimeoutError(`Checkout readiness check timed out after ${timeoutMs}ms`));
				};
			}),
		[checkoutId, client, locale],
	);

	const verify = useCallback(
		async (
			stage: ReadinessStage,
			{
				settleMs = 0,
				maxMs = 7000,
				followOnSavesMounted = false,
				reportFailOpen = true,
				deadline = createReadinessDeadline(),
			}: VerifyOptions = {},
		): Promise<ReadinessResult> => {
			const startedAt = Date.now();
			let attempts = 0;

			for (;;) {
				let result: ReadinessResult;
				const remainingMs = deadline - Date.now();

				if (remainingMs <= 0) {
					// Budget already spent (e.g. by slow commits): don't start a request
					// that has no time left to answer.
					result = {
						status: "error",
						reason: "timeout",
						message: `Checkout readiness budget of ${READINESS_BUDGET_MS}ms was used up before the check could run`,
						attempts,
						elapsedMs: Date.now() - startedAt,
					};
				} else {
					attempts += 1;

					try {
						const checkout = await fetchFreshCheckout(remainingMs);

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
				// "loading" (a save canceled by an earlier unmount) can't hang this,
				// and never past the shared deadline.
				const keepWaiting =
					Date.now() + POLL_INTERVAL_MS < deadline &&
					(elapsed < settleMs || ((savesInFlight || settlingOnItsOwn) && elapsed < maxMs));

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
