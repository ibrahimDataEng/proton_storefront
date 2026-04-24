import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { PasswordInput } from "@/checkout/components/PasswordInput";
import { Checkbox } from "@/checkout/components/Checkbox";
import { TextInput } from "@/checkout/components/TextInput";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { useGuestUserForm } from "@/checkout/sections/GuestUser/useGuestUserForm";

type GuestUserProps = Pick<SignInFormContainerProps, "onSectionChange"> & {
	onEmailChange: (email: string) => void;
	email: string;
};

export const GuestUser: React.FC<GuestUserProps> = ({
	onSectionChange,
	onEmailChange,
	email: initialEmail,
}) => {
	const { contact } = useCheckoutMessages();
	const form = useGuestUserForm({ initialEmail });
	const { handleChange } = form;
	const { createAccount } = form.values;

	return (
		<SignInFormContainer
			title={contact.contactDetails}
			redirectSubtitle={contact.alreadyHaveAccount}
			redirectButtonLabel={contact.signIn}
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
					<Checkbox
						name="createAccount"
						label={contact.createAccount}
						data-testid={"createAccountCheckbox"}
					/>
					{createAccount && (
						<div className="mt-2">
							<PasswordInput name="password" label={contact.passwordMinLength} required />
						</div>
					)}
				</div>
			</FormProvider>
		</SignInFormContainer>
	);
};
