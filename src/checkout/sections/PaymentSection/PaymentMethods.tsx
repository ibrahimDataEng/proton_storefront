import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { paymentMethodToComponent } from "./supportedPaymentApps";
import { codGatewayId } from "@/checkout/sections/PaymentSection/CODComponent/types";
import { stripeGatewayId } from "@/checkout/sections/PaymentSection/StripeElements/types";
import { PaymentSectionSkeleton } from "@/checkout/sections/PaymentSection/PaymentSectionSkeleton";
import { usePayments } from "@/checkout/sections/PaymentSection/usePayments";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { clearUnclaimedPaymentGateway } from "@/checkout/lib/lastPaymentGateway";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";

/**
 * Presentation-only lookup — payment.title/cashOnDelivery/creditCard etc.
 * already exist in checkoutMessages.ts (COD's own labels were already
 * there; creditCard/creditCardDescription added alongside this rework).
 * Falls back to the raw gateway id for any gateway this list doesn't have
 * copy for yet (Adyen/Dummy exist in the codebase but aren't live here).
 */
const useGatewayDisplayInfo = () => {
	const { payment } = useCheckoutMessages();

	return (gatewayId: string): { icon: string; label: string; description: string } => {
		switch (gatewayId) {
			case codGatewayId:
				return { icon: "💵", label: payment.cashOnDelivery, description: payment.cashOnDeliveryDescription };
			case stripeGatewayId:
				return { icon: "💳", label: payment.creditCard, description: payment.creditCardDescription };
			default:
				return { icon: "🏦", label: gatewayId, description: "" };
		}
	};
};

export const PaymentMethods = () => {
	const { availablePaymentGateways, fetching } = usePayments();
	const { payment } = useCheckoutMessages();
	const getGatewayDisplayInfo = useGatewayDisplayInfo();
	const {
		changingBillingCountry,
		updateState: { checkoutDeliveryMethodUpdate },
	} = useCheckoutUpdateState();

	const gatewaysWithDefinedComponent = useMemo(
		() => availablePaymentGateways.filter((gateway) => gateway.id in paymentMethodToComponent),
		[availablePaymentGateways],
	);

	// Amazon-style default: the first available method is pre-selected
	// rather than requiring an explicit click before anything can proceed —
	// same "auto-pick a sensible default, let the user override" precedent
	// DeliveryMethods' own useDeliveryMethodsForm already uses for shipping
	// method selection (getAutoSetMethod). Re-validated whenever the
	// available gateway list changes, so a stale selection id (e.g. a
	// gateway that stopped being available) never points at nothing.
	const [selectedGatewayId, setSelectedGatewayId] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (selectedGatewayId && gatewaysWithDefinedComponent.some(({ id }) => id === selectedGatewayId)) {
			return;
		}

		// Returning from a payment redirect overrides the "first available"
		// default — Stripe's own return_url carries payment_intent/
		// payment_intent_client_secret (Adyen's equivalent uses
		// redirectResult/resultCode instead, and COD never redirects at all —
		// see src/checkout/lib/utils/url.ts's queryParamsMap), so this pair's
		// mere presence unambiguously means Stripe's reconciliation needs to
		// run, regardless of which gateway would otherwise sort first. Without
		// this, a fresh page load after Stripe's redirect silently re-defaults
		// to COD (or whatever sorts first) and StripeComponent — the only code
		// that reads these params and calls transactionProcess — never mounts,
		// leaving the "Almost done..." overlay stuck forever even though
		// Stripe already confirmed the payment.
		const { paymentIntent } = getQueryParams();
		if (paymentIntent && gatewaysWithDefinedComponent.some(({ id }) => id === stripeGatewayId)) {
			setSelectedGatewayId(stripeGatewayId);
			return;
		}

		setSelectedGatewayId(gatewaysWithDefinedComponent[0]?.id);
	}, [gatewaysWithDefinedComponent, selectedGatewayId]);

	// A COD marker nobody has claimed yet (e.g. a COD attempt that failed) must
	// not follow the customer into a card payment — otherwise that order's
	// confirmation shows the cash-on-delivery reminder. See lastPaymentGateway.ts.
	useEffect(() => {
		if (selectedGatewayId && selectedGatewayId !== codGatewayId) {
			clearUnclaimedPaymentGateway();
		}
	}, [selectedGatewayId]);

	// delivery methods change total price so we want to wait until the change is done
	if (changingBillingCountry || fetching || checkoutDeliveryMethodUpdate === "loading") {
		return <PaymentSectionSkeleton />;
	}

	const selectedGateway = gatewaysWithDefinedComponent.find(({ id }) => id === selectedGatewayId);
	// gateway.id matches one of paymentMethodToComponent's keys by construction
	// (gatewaysWithDefinedComponent is filtered against that same object) —
	// TypeScript can't see that relationship through the .find() lookup.
	const SelectedComponent = selectedGateway
		? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			paymentMethodToComponent[selectedGateway.id as keyof typeof paymentMethodToComponent]
		: undefined;

	return (
		<div className="flex flex-col gap-y-4">
			{gatewaysWithDefinedComponent.length > 1 && (
				<div role="radiogroup" aria-label={payment.title} className="flex flex-col gap-y-2">
					{gatewaysWithDefinedComponent.map((gateway) => {
						const isSelected = gateway.id === selectedGatewayId;
						const { icon, label, description } = getGatewayDisplayInfo(gateway.id);

						return (
							<label
								key={gateway.id}
								className={clsx(
									"relative flex cursor-pointer flex-row items-center gap-3 rounded border px-4 py-3 transition-colors duration-150",
									"border-neutral-300 hover:border-[#2d6a4f]",
									{ "border-2 border-[#2d6a4f] bg-[#e8f5ee]": isSelected },
								)}
							>
								<input
									type="radio"
									name="paymentMethod"
									value={gateway.id}
									checked={isSelected}
									onChange={() => setSelectedGatewayId(gateway.id)}
									className="h-4 w-4 shrink-0 border-neutral-300 text-[#2d6a4f] focus:ring focus:ring-[#2d6a4f] focus:ring-opacity-30 focus:ring-offset-0"
								/>
								<span aria-hidden="true" className="text-xl leading-none">
									{icon}
								</span>
								<span className="flex flex-col">
									<span className="font-medium">{label}</span>
									{description && <span className="text-sm text-neutral-500">{description}</span>}
								</span>
							</label>
						);
					})}
				</div>
			)}

			{SelectedComponent && selectedGateway && (
				<SelectedComponent
					key={selectedGateway.id}
					// @ts-expect-error -- gateway matches the id but TypeScript doesn't know that
					config={selectedGateway}
				/>
			)}
		</div>
	);
};
