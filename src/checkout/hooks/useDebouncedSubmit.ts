import { useEffect, useMemo, useRef } from "react";

export type DebouncedSubmit<TArgs extends Array<any>> = ((...args: TArgs) => void) & {
	// Runs the pending call right now (if any) and resolves with its result.
	flush: () => Promise<unknown>;
	// Drops the pending call without running it.
	cancel: () => void;
	isPending: () => boolean;
};

interface DebouncedSubmitOptions {
	wait?: number;
	// Called when a pending call is dropped by unmount. Callers that flag an
	// update scope as "loading" before debouncing use it to put that scope back
	// to idle — nothing is in flight any more, and a scope left at "loading"
	// silently blocks Stripe's Pay effect and PaymentMethods' skeleton gate.
	onPendingCancelledOnUnmount?: () => void;
}

// One stable debounced function per mounted hook. The previous lodash-based
// version re-created the debounced function whenever `onSubmit` changed
// identity but only ever cancelled the FIRST instance on unmount, so later
// instances' timers could still fire after the step was gone. Here the timer
// and pending args live in a single instance, and each call runs whatever
// `onSubmit` is current at fire time.
export const useDebouncedSubmit = <TArgs extends Array<any>>(
	onSubmit: (...args: TArgs) => Promise<any> | void,
	{ wait = 2000, onPendingCancelledOnUnmount }: DebouncedSubmitOptions = {},
): DebouncedSubmit<TArgs> => {
	const onSubmitRef = useRef(onSubmit);
	onSubmitRef.current = onSubmit;

	const onCancelledRef = useRef(onPendingCancelledOnUnmount);
	onCancelledRef.current = onPendingCancelledOnUnmount;

	const debounced = useMemo(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		let pendingArgs: TArgs | null = null;

		const clearTimer = () => {
			if (timer !== undefined) {
				clearTimeout(timer);
				timer = undefined;
			}
		};

		const flush = () => {
			clearTimer();
			if (!pendingArgs) {
				return Promise.resolve(undefined);
			}
			const args = pendingArgs;
			pendingArgs = null;
			return Promise.resolve(onSubmitRef.current(...args));
		};

		const submit = (...args: TArgs) => {
			pendingArgs = args;
			clearTimer();
			timer = setTimeout(() => {
				flush().catch((error) => console.error("Debounced checkout submit failed:", error));
			}, wait);
		};

		return Object.assign(submit, {
			flush,
			cancel: () => {
				clearTimer();
				pendingArgs = null;
			},
			isPending: () => pendingArgs !== null,
		});
	}, [wait]);

	useEffect(
		() => () => {
			if (debounced.isPending()) {
				debounced.cancel();
				onCancelledRef.current?.();
			}
		},
		[debounced],
	);

	return debounced;
};
