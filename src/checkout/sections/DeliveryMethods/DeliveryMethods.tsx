import React from "react";
import { Divider } from "@/checkout/components/Divider";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { Title } from "@/checkout/components/Title";
import { SelectBox } from "@/checkout/components/SelectBox";
import { SelectBoxGroup } from "@/checkout/components/SelectBoxGroup";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { type CommonSectionProps } from "@/checkout/lib/globalTypes";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { useDeliveryMethodsForm } from "@/checkout/sections/DeliveryMethods/useDeliveryMethodsForm";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";
import { useUser } from "@/checkout/hooks/useUser";

export const DeliveryMethods: React.FC<CommonSectionProps> = ({ collapsed }) => {
	const { delivery, locale } = useCheckoutMessages();
	const { checkout } = useCheckout();
	const { authenticated } = useUser();
	const { shippingMethods, shippingAddress } = checkout;
	const form = useDeliveryMethodsForm();
	const { updateState } = useCheckoutUpdateState();

	const getSubtitle = ({ min, max }: { min?: number | null; max?: number | null }) => {
		if (!min || !max) {
			return undefined;
		}

		return `${min}-${max} ${delivery.businessDays}`;
	};

	if (!checkout?.isShippingRequired || collapsed) {
		return null;
	}

	return (
		<FormProvider form={form}>
			<Divider />
			<div className="py-4" data-testid="deliveryMethods">
				<Title className="mb-2">{delivery.title}</Title>
				{!authenticated && !shippingAddress && <p>{delivery.fillShippingAddress}</p>}
				{authenticated && !shippingAddress && updateState.checkoutShippingUpdate ? (
					<DeliveryMethodsSkeleton />
				) : (
					<SelectBoxGroup label={delivery.methodsLabel}>
						{shippingMethods?.map(
							({ id, name, price, minimumDeliveryDays: min, maximumDeliveryDays: max }) => (
								<SelectBox key={id} name="selectedMethodId" value={id}>
									<div className="pointer-events-none flex min-h-12 grow flex-col justify-center">
										<div className="flex flex-row items-center justify-between self-stretch">
											<p>{name}</p>
											<p>{getFormattedMoney(price, false, locale)}</p>
										</div>
										<p className="font-xs" color="secondary">
											{getSubtitle({ min, max })}
										</p>
									</div>
								</SelectBox>
							),
						)}
					</SelectBoxGroup>
				)}
			</div>
		</FormProvider>
	);
};
