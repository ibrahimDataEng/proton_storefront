import { Section } from "./Section";
import { type OrderFragment, type ShippingFragment } from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

const isShipping = (deliveryMethod: OrderFragment["deliveryMethod"]): deliveryMethod is ShippingFragment =>
	deliveryMethod?.__typename === "ShippingMethod";

export const DeliverySection = ({ deliveryMethod }: { deliveryMethod: OrderFragment["deliveryMethod"] }) => {
	const { delivery } = useCheckoutMessages();

	const getDeliveryEstimateText = () => {
		const { minimumDeliveryDays: min, maximumDeliveryDays: max } = deliveryMethod as ShippingFragment;

		if (!min || !max) {
			return undefined;
		}

		return `${min}-${max} ${delivery.businessDays}`;
	};

	return (
		<Section title={delivery.deliveryMethod}>
			{!isShipping(deliveryMethod) ? (
				<p color="secondary">{delivery.notApplicable}</p>
			) : (
				<>
					<p>{deliveryMethod.name}</p>
					<p>{getDeliveryEstimateText()}</p>
				</>
			)}
		</Section>
	);
};
