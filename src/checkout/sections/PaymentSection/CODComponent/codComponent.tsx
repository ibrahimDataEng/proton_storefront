"use client";

import { codGatewayId } from "./types";
import { Button } from "@/checkout/components";
import { useTransactionInitializeMutation } from "@/checkout/graphql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutComplete } from "@/checkout/hooks/useCheckoutComplete";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const CODComponent = () => {
	const { payment } = useCheckoutMessages();
	const { showCustomErrors } = useAlerts();
	const { checkout } = useCheckout();
	const [transactionInitializeState, transactionInitialize] = useTransactionInitializeMutation();
	const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();
	const isInProgress = completingCheckout || transactionInitializeState.fetching;

	const onInitalizeClick = () => {
		void transactionInitialize({
			checkoutId: checkout.id,
			paymentGateway: {
				id: codGatewayId,
				data: {},
			},
		})
			.catch((err) => {
				console.error("There was a problem with the Cash on Delivery gateway:", err);
			})
			.then(() => onCheckoutComplete())
			.then((res) => {
				if (res?.apiErrors) {
					res.apiErrors.forEach((error) => {
						showCustomErrors([{ message: error.message }]);
					});
				}
			});
	};

	return (
		<div>
			<p className="font-semibold text-neutral-900">{payment.cashOnDelivery}</p>
			<p className="mb-3 text-sm text-neutral-500">{payment.cashOnDeliveryDescription}</p>
			{isInProgress ? (
				<Button variant="primary" disabled={true} label={payment.processingPayment} />
			) : (
				<Button variant="primary" onClick={onInitalizeClick} label={payment.confirmCashOnDelivery} />
			)}
		</div>
	);
};
