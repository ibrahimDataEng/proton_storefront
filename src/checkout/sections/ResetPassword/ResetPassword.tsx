import React from "react";
import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { Button } from "@/checkout/components/Button";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { useResetPasswordForm } from "@/checkout/sections/ResetPassword/useResetPasswordForm";

interface ResetPasswordProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onResetPasswordSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSectionChange, onResetPasswordSuccess }) => {
	const { contact } = useCheckoutMessages();
	const form = useResetPasswordForm({ onSuccess: onResetPasswordSuccess });

	return (
		<SignInFormContainer
			title={contact.resetPassword}
			redirectSubtitle={contact.rememberedPassword}
			redirectButtonLabel={contact.signIn}
			onSectionChange={onSectionChange}
			subtitle={contact.provideNewPassword}
		>
			<FormProvider form={form}>
				<PasswordInput name="password" label={contact.password} required />
				<div className="mt-4 flex w-full flex-row items-center justify-end">
					<Button ariaLabel={contact.resetPassword} label={contact.resetPassword} type="submit" />
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
