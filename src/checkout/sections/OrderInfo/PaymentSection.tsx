import { AlertIcon, SuccessIcon } from "../../assets/icons";
import { Section } from "./Section";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { usePaymentStatus } from "@/checkout/sections/PaymentSection/utils";

const ErrorMessage = ({ message }: { message: string }) => {
	return (
		<>
			<p className="mr-1 text-red-500">{message}</p>
			<AlertIcon />
		</>
	);
};

const SuccessMessage = ({ message }: { message: string }) => {
	return (
		<>
			<p color="success" className="mr-1">
				{message}
			</p>
			<SuccessIcon />
		</>
	);
};

export const PaymentSection = ({ isCod }: { isCod: boolean }) => {
	const { payment } = useCheckoutMessages();
	const { order } = useOrder();
	const paymentStatus = usePaymentStatus(order);

	return (
		<Section title={payment.payment}>
			<div data-testid="paymentStatus">
				<div className="flex flex-row items-center">
					{/* COD's transactionInitialize always reports CHARGE_SUCCESS even
					though no money has actually changed hands — never show a
					payment-received message for it, regardless of chargeStatus. */}
					{!isCod && paymentStatus === "authorized" && (
						<SuccessMessage message={payment.receivedAuthorization} />
					)}
					{!isCod && paymentStatus === "paidInFull" && <SuccessMessage message={payment.receivedPayment} />}
					{paymentStatus === "overpaid" && <ErrorMessage message={payment.overpaid} />}
				</div>
			</div>
		</Section>
	);
};
