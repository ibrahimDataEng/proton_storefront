import { useEffect, useRef } from "react";
import { type CheckoutFragment } from "@/checkout/graphql";

// Commit-on-advance (Phase 2 of front_store-9ze). Autosave stays for UX, but
// nothing depends on it for correctness: before the wizard leaves a step,
// every form mounted on that step saves its CURRENT values immediately and
// the wizard waits for those saves before running the server readiness check.
//
// Registration is module-level on purpose: only the current step's forms are
// mounted (CheckoutForm renders one step at a time), so whatever is registered
// when Continue is clicked is exactly what that step needs to save.

export interface StepCommitContext {
	// The checkout as returned by the most recent successful save in this run.
	// Later commits read it instead of their own render-time checkout, which is
	// stale until urql's refetch lands (e.g. delivery methods depend on the
	// shipping address saved a moment earlier in the same run).
	checkout?: CheckoutFragment | null;
}

// Resolves true when this form's data is saved (or there was nothing to save),
// false when it could not be saved (invalid form, API error).
export type StepCommit = (context: StepCommitContext) => Promise<boolean>;

// Commits run group by group in ascending order; a group runs in parallel.
export const STEP_COMMIT_ORDER = {
	contact: 0,
	shippingAddress: 10,
	billingAddress: 20,
	// After any billing address-list commit, so a checked "same as shipping"
	// box always wins for signed-in customers too.
	billingSameAsShipping: 25,
	deliveryMethod: 30,
} as const;

interface RegisteredCommit {
	order: number;
	commit: StepCommit;
}

const registeredCommits = new Map<symbol, RegisteredCommit>();

export const useRegisterStepCommit = (order: number, commit: StepCommit) => {
	const commitRef = useRef(commit);
	commitRef.current = commit;

	useEffect(() => {
		const id = Symbol("stepCommit");
		registeredCommits.set(id, { order, commit: (context) => commitRef.current(context) });
		return () => {
			registeredCommits.delete(id);
		};
	}, [order]);
};

// useSubmit's result also carries the mutation payload (`data`, e.g.
// `{ errors, checkout }`) whenever the mutation actually ran — not part of its
// public return type, so read it through this one narrow helper.
export const getCheckoutFromSubmitResult = (result: unknown): CheckoutFragment | null | undefined => {
	const data = (result as { data?: { checkout?: CheckoutFragment | null } } | undefined)?.data;
	return data?.checkout;
};

export const commitMountedStepForms = async (): Promise<boolean> => {
	const context: StepCommitContext = {};
	const orders = [...new Set([...registeredCommits.values()].map(({ order }) => order))].sort(
		(a, b) => a - b,
	);
	let allSaved = true;

	for (const order of orders) {
		const group = [...registeredCommits.values()].filter((entry) => entry.order === order);
		const results = await Promise.all(
			group.map(({ commit }) =>
				commit(context).catch((error) => {
					console.error("Checkout step commit failed:", error);
					return false;
				}),
			),
		);
		allSaved = allSaved && results.every(Boolean);
	}

	return allSaved;
};
