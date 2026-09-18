import { DeliverySection } from "./DeliverySection";
import { PaymentSection } from "./PaymentSection";
import { Section } from "./Section";
import { Address } from "@/checkout/components/Address";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const OrderInfo = ({ isCod }: { isCod: boolean }) => {
	const { orderInfo, address } = useCheckoutMessages();
	const {
		order: { deliveryMethod, shippingAddress, billingAddress, userEmail },
	} = useOrder();

	return (
		<section className="mt-8">
			<PaymentSection isCod={isCod} />
			<DeliverySection deliveryMethod={deliveryMethod} />
			<Section title={orderInfo.contactDetails}>
				<p>{userEmail}</p>
			</Section>
			{shippingAddress && (
				<Section title={address.shippingAddress}>
					<Address address={shippingAddress} />
				</Section>
			)}
			{billingAddress && (
				<Section title={address.billingAddress}>
					<Address address={billingAddress} />
				</Section>
			)}
		</section>
	);
};
