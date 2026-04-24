import React from "react";
import { PaymentMethods } from "./PaymentMethods";
import { Divider } from "@/checkout/components/Divider";
import { Title } from "@/checkout/components/Title";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const PaymentSection = () => {
	const { payment } = useCheckoutMessages();

	return (
		<>
			<Divider />
			<div className="py-4" data-testid="paymentMethods">
				<Title>{payment.title}</Title>
				<PaymentMethods />
			</div>
		</>
	);
};
