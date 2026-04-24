import React from "react";
import { Title } from "@/checkout/components";
import { LinkAsButton } from "@/checkout/components/LinkAsButton";
import { ErrorContentWrapper } from "@/checkout/components/ErrorContentWrapper";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const EmptyCartPage = () => {
	const { emptyCart } = useCheckoutMessages();

	return (
		<ErrorContentWrapper>
			<Title className="mb-0 text-xl">{emptyCart.title}</Title>
			<p>{emptyCart.description}</p>
			<LinkAsButton href="/" variant="secondary">
				{emptyCart.backToStore}
			</LinkAsButton>
		</ErrorContentWrapper>
	);
};
