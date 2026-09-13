import { useEffect, useState } from "react";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutComplete } from "@/checkout/hooks/useCheckoutComplete";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { usePaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";
import { type PaymentStatus } from "@/checkout/sections/PaymentSection/types";
import { usePaymentGatewaysInitialize } from "@/checkout/sections/PaymentSection/usePaymentGatewaysInitialize";
import { usePaymentStatus } from "@/checkout/sections/PaymentSection/utils";

const paidStatuses: PaymentStatus[] = ["overpaid", "paidInFull", "authorized"];

export const usePayments = () => {
	const { checkout } = useCheckout();
	const paymentStatus = usePaymentStatus(checkout);

	const { fetching, availablePaymentGateways } = usePaymentGatewaysInitialize();

	const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();
	const { showCustomErrors } = useAlerts();
	const { payment } = useCheckoutMessages();
	// This effect can be the ONLY thing that ever runs onCheckoutComplete
	// after a redirect-return lands mid-processing (see stripeElementsForm.tsx
	// and useAdyenDropin.ts for the other two callers of this same context) —
	// on failure it must dismiss the "Almost done..." overlay itself, exactly
	// like those two already do on their own error paths, or the customer is
	// left staring at that overlay forever with no visible way to act on the
	// error toast underneath it.
	const { setIsProcessingPayment } = usePaymentProcessingScreen();

	// Stops this effect from retrying forever once checkoutComplete has
	// rejected the checkout: paymentStatus is derived only from
	// chargeStatus/authorizeStatus (already paid via the payment gateway) and
	// stays "paid" regardless of *why* checkoutComplete failed (e.g.
	// SHIPPING_METHOD_NOT_SET) — retrying the identical call changes nothing
	// about that. Without this guard, completingCheckout cycling
	// false -> true -> false on every failed attempt re-satisfies this
	// effect's own dependency array, so it fired again every ~100-200ms with
	// no bound — confirmed live in production (162+ calls, no stop) before
	// this fix.
	const [completionFailed, setCompletionFailed] = useState(false);

	useEffect(() => {
		// the checkout was already paid earlier, complete
		if (completionFailed || completingCheckout || !paidStatuses.includes(paymentStatus)) {
			return;
		}

		void onCheckoutComplete().then((result) => {
			if (!result?.hasErrors) {
				return;
			}

			setCompletionFailed(true);
			setIsProcessingPayment(false);

			if (result.apiErrors?.length) {
				result.apiErrors.forEach((error) => showCustomErrors([{ message: error.message }]));
			} else {
				showCustomErrors([{ message: payment.unexpectedError }]);
			}
		});
	}, [
		completingCheckout,
		completionFailed,
		onCheckoutComplete,
		paymentStatus,
		setIsProcessingPayment,
		showCustomErrors,
		payment,
	]);

	return { fetching, availablePaymentGateways };
};
