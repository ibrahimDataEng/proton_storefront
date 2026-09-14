import { useEffect, useMemo, useRef } from "react";
import { useCheckoutEmailUpdateMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import {
	getCheckoutFromSubmitResult,
	STEP_COMMIT_ORDER,
	useRegisterStepCommit,
} from "@/checkout/hooks/useStepCommit";
import { useSubmit } from "@/checkout/hooks/useSubmit/useSubmit";
import { isValidEmail } from "@/checkout/lib/utils/common";
import { useCheckoutUpdateStateChange } from "@/checkout/state/updateStateStore";

interface CheckoutEmailUpdateFormData {
	email: string;
}

export const useCheckoutEmailUpdate = ({ email }: CheckoutEmailUpdateFormData) => {
	const { checkout } = useCheckout();
	const [, updateEmail] = useCheckoutEmailUpdateMutation();
	const { setCheckoutUpdateState } = useCheckoutUpdateStateChange("checkoutEmailUpdate");
	const previousEmail = useRef(email);
	const latestEmail = useRef(email);
	latestEmail.current = email;

	const onSubmit = useSubmit<CheckoutEmailUpdateFormData, typeof updateEmail>(
		useMemo(
			() => ({
				scope: "checkoutEmailUpdate",
				onSubmit: updateEmail,
				shouldAbort: async ({ formData: { email } }) => {
					// @todo we'll use validateField once we fix it because
					// https://github.com/jaredpalmer/formik/issues/1755
					const isValid = await isValidEmail(email);
					return !isValid;
				},
				// Providing onAbort makes useSubmit reset the scope to idle when an
				// invalid email is skipped, instead of leaving it at "loading".
				onAbort: () => {},
				parse: ({ languageCode, checkoutId, email }) => ({ languageCode, checkoutId, email }),
			}),
			[updateEmail],
		),
	);

	const debouncedSubmit = useDebouncedSubmit(onSubmit, {
		onPendingCancelledOnUnmount: () => setCheckoutUpdateState("success"),
	});

	useEffect(() => {
		const hasEmailChanged = email !== previousEmail.current;

		if (hasEmailChanged) {
			previousEmail.current = email;
			void debouncedSubmit({ email });
		}
	}, [debouncedSubmit, email]);

	// Commit-on-advance: save the email as typed right now, not 2s later.
	useRegisterStepCommit(STEP_COMMIT_ORDER.contact, async (context) => {
		debouncedSubmit.cancel();
		const currentEmail = latestEmail.current.trim();

		if (!(await isValidEmail(currentEmail))) {
			setCheckoutUpdateState("success");
			return false;
		}

		if (currentEmail === checkout?.email) {
			setCheckoutUpdateState("success");
			return true;
		}

		previousEmail.current = latestEmail.current;
		const result = await onSubmit({ email: currentEmail });
		const savedCheckout = getCheckoutFromSubmitResult(result);
		if (savedCheckout) {
			context.checkout = savedCheckout;
		}

		return !result.hasErrors;
	});
};
