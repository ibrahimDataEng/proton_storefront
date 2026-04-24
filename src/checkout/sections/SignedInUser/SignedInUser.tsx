import React from "react";
import { useSaleorAuthContext } from "@saleor/auth-sdk/react";
import { SignInFormContainer, type SignInFormContainerProps } from "../Contact/SignInFormContainer";
import { Button } from "@/checkout/components/Button";
import { useUser } from "@/checkout/hooks/useUser";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

interface SignedInUserProps extends Pick<SignInFormContainerProps, "onSectionChange"> {
	onSignOutSuccess: () => void;
}

export const SignedInUser: React.FC<SignedInUserProps> = ({ onSectionChange, onSignOutSuccess }) => {
	const { contact } = useCheckoutMessages();
	const { signOut } = useSaleorAuthContext();
	const { user } = useUser();

	const handleLogout = async () => {
		signOut();
		onSignOutSuccess();
	};

	return (
		<SignInFormContainer title={contact.account} onSectionChange={onSectionChange}>
			<div className="flex flex-row justify-between">
				<p className="text-base font-bold">{user?.email}</p>
				<Button
					ariaLabel={contact.signOut}
					variant="tertiary"
					onClick={handleLogout}
					label={contact.signOut}
				/>
			</div>
		</SignInFormContainer>
	);
};
