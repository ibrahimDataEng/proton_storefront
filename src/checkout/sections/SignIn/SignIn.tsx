import React from "react";
import { Button } from "@/checkout/components/Button";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { TextInput } from "@/checkout/components/TextInput";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useErrorMessages } from "@/checkout/hooks/useErrorMessages";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { isValidEmail } from "@/checkout/lib/utils/common";
import {
	SignInFormContainer,
	type SignInFormContainerProps,
} from "@/checkout/sections/Contact/SignInFormContainer";
import { useSignInForm } from "@/checkout/sections/SignIn/useSignInForm";
import { usePasswordResetRequest } from "@/checkout/sections/SignIn/usePasswordResetRequest";
import { useCheckout } from "@/checkout/hooks/useCheckout";

interface SignInProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onSignInSuccess: () => void;
	onEmailChange: (email: string) => void;
	email: string;
}

export const SignIn: React.FC<SignInProps> = ({
	onSectionChange,
	onSignInSuccess,
	onEmailChange,
	email: initialEmail,
}) => {
	const { contact, payment } = useCheckoutMessages();
	const {
		checkout: { email: checkoutEmail },
	} = useCheckout();
	const { errorMessages } = useErrorMessages();

	const form = useSignInForm({
		onSuccess: onSignInSuccess,
		initialEmail: initialEmail || checkoutEmail || "",
	});

	const {
		values: { email },
		handleChange,
		setErrors,
		setTouched,
		isSubmitting,
	} = form;

	const { onPasswordResetRequest, passwordResetSent } = usePasswordResetRequest({
		email,
		shouldAbort: async () => {
			const isValid = await isValidEmail(email);

			if (!isValid) {
				await setTouched({ email: true });
				setErrors({ email: errorMessages.emailInvalid });
				return true;
			}
			setErrors({});

			return false;
		},
	});

	return (
		<SignInFormContainer
			title={contact.signIn}
			redirectSubtitle={contact.newCustomer}
			redirectButtonLabel={contact.guestCheckout}
			onSectionChange={onSectionChange}
		>
			<FormProvider form={form}>
				<div className="grid grid-cols-1 gap-3">
					<TextInput
						required
						name="email"
						label={contact.email}
						onChange={(event) => {
							handleChange(event);
							onEmailChange(event.currentTarget.value);
						}}
					/>
					<PasswordInput name="password" label={contact.password} required />
					<div className="flex w-full flex-row items-center justify-end">
						<Button
							ariaDisabled={isSubmitting}
							ariaLabel={contact.forgotPassword}
							variant="tertiary"
							label={passwordResetSent ? contact.resend : contact.forgotPassword}
							className="ml-1 mr-4"
							onClick={(e) => (isSubmitting ? e.preventDefault() : onPasswordResetRequest)}
						/>
						<Button
							type="submit"
							disabled={isSubmitting}
							ariaLabel={contact.signIn}
							label={isSubmitting ? payment.processingPayment : contact.signIn}
						/>
					</div>
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
