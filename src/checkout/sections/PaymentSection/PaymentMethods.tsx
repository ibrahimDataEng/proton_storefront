import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { paymentMethodToComponent } from "./supportedPaymentApps";
import { Button } from "@/checkout/components/Button";
import { codGatewayId } from "@/checkout/sections/PaymentSection/CODComponent/types";
import { stripeGatewayId } from "@/checkout/sections/PaymentSection/StripeElements/types";
import { PaymentSectionSkeleton } from "@/checkout/sections/PaymentSection/PaymentSectionSkeleton";
import { usePayments } from "@/checkout/sections/PaymentSection/usePayments";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { clearUnclaimedPaymentGateway } from "@/checkout/lib/lastPaymentGateway";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";

const WHATSAPP_URL = "https://wa.me/971558711442";

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

// Retrying re-mounts PaymentMethodsInner via a key bump rather than calling
// into usePayments/usePaymentGatewaysInitialize directly (both live under
// hooks/ conventions this session isn't approved to touch) — a fresh mount
// re-runs that hook's own on-mount initialize effect exactly as a real page
// load would, with no change to its internals.
export const PaymentMethods = () => {
	const [retryKey, setRetryKey] = useState(0);
	return <PaymentMethodsInner key={retryKey} onRetry={() => setRetryKey((key) => key + 1)} />;
};

const PaymentMethodsInner = ({ onRetry }: { onRetry: () => void }) => {
	const { availablePaymentGateways, fetching } = usePayments();
	const { payment, readiness } = useCheckoutMessages();
	const getGatewayDisplayInfo = useGatewayDisplayInfo();
	const {
		changingBillingCountry,
		updateState: { checkoutDeliveryMethodUpdate },
	} = useCheckoutUpdateState();

	const gatewaysWithDefinedComponent = useMemo(
		() => availablePaymentGateways.filter((gateway) => gateway.id in paymentMethodToComponent),
		[availablePaymentGateways],
	);

	// A gateway that failed its own init webhook (401 / timeout / connection
	// refused — indistinguishable at this layer, confirmed against Saleor's
	// PaymentGatewayInitialize.prepare_response()) is still present in
	// gatewaysWithDefinedComponent: Saleor always returns one entry per
	// requested app, never omits a failed one, so `gateway.id in
	// paymentMethodToComponent` alone can't tell a broken entry from a
	// working one. A failed entry carries a non-empty `errors` array; a
	// healthy one's is always `[]` (confirmed for COD specifically — a
	// successful init has `data: {}`, not `null`, which is why `data` is not
	// used as the discriminator here: an empty-but-valid `data` would be
	// wrongly excluded by a `data == null` check).
	const usableGateways = useMemo(
		() => gatewaysWithDefinedComponent.filter((gateway) => !gateway.errors?.length),
		[gatewaysWithDefinedComponent],
	);
	const excludedGateways = useMemo(
		() => gatewaysWithDefinedComponent.filter((gateway) => gateway.errors?.length),
		[gatewaysWithDefinedComponent],
	);

	// No default pre-selection: the customer must actively pick a gateway
	// before its component mounts (and, in turn, before any gateway's own
	// Pay/Confirm button can even appear) — an earlier "Amazon-style" default
	// silently auto-picked the first available method (in practice, always
	// COD), which meant a customer could complete checkout without ever
	// choosing cash-on-delivery on purpose. Re-validated whenever the
	// available gateway list changes, so a stale selection id (e.g. a
	// gateway that stopped being available) never points at nothing.
	const [selectedGatewayId, setSelectedGatewayId] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (selectedGatewayId && usableGateways.some(({ id }) => id === selectedGatewayId)) {
			return;
		}

		// Returning from a payment redirect is not a "default" — it's Stripe's
		// own return_url carrying payment_intent/payment_intent_client_secret
		// (Adyen's equivalent uses redirectResult/resultCode instead, and COD
		// never redirects at all — see src/checkout/lib/utils/url.ts's
		// queryParamsMap), so this pair's mere presence unambiguously means
		// Stripe's reconciliation needs to run regardless of any other
		// gateway's position in the list. Without this, a fresh page load
		// after Stripe's redirect would sit unselected and StripeComponent —
		// the only code that reads these params and calls transactionProcess —
		// would never mount, leaving the "Almost done..." overlay stuck
		// forever even though Stripe already confirmed the payment. Gated on
		// usableGateways, not gatewaysWithDefinedComponent — selecting a
		// Stripe entry that itself failed init would mount StripeComponent
		// with no publishable key instead of reconciling anything.
		const { paymentIntent } = getQueryParams();
		if (paymentIntent && usableGateways.some(({ id }) => id === stripeGatewayId)) {
			setSelectedGatewayId(stripeGatewayId);
			return;
		}

		// A single usable gateway isn't a "choice" — the radio list below is
		// hidden in that case (length > 1 gate), so there's nothing for the
		// customer to click; auto-select it or checkout would be stuck with
		// no way to proceed.
		if (usableGateways.length === 1) {
			setSelectedGatewayId(usableGateways[0]?.id);
		}
	}, [usableGateways, selectedGatewayId]);

	// A COD marker nobody has claimed yet (e.g. a COD attempt that failed) must
	// not follow the customer into a card payment — otherwise that order's
	// confirmation shows the cash-on-delivery reminder. See lastPaymentGateway.ts.
	useEffect(() => {
		if (selectedGatewayId && selectedGatewayId !== codGatewayId) {
			clearUnclaimedPaymentGateway();
		}
	}, [selectedGatewayId]);

	// Stripe's return_url lands here with the payment already taken — the
	// reconciliation that follows (StripeComponent reading payment_intent from
	// the URL) must never be replaced by this panel, even if gateway init
	// itself comes back empty on this particular mount.
	const isRedirectReturn = !!getQueryParams().processingPayment;

	// usePaymentGatewaysInitialize's own mutation-in-flight `fetching` starts
	// false and only flips true once its mount effect actually calls the
	// mutation — so on the very first render, before that effect has run,
	// `fetching` is false AND its gatewayConfigs state is still its initial
	// empty array. Without this ref, that single tick looks identical to
	// "initialization finished with nothing usable" and both the panel and
	// its log would fire immediately on every mount, real failure or not
	// (caught live: the log fired even on a normal COD-only mount that
	// rendered correctly moments later). Once a real fetch cycle is observed,
	// "no gateway" can only mean it has actually settled empty.
	const hasStartedInitializing = useRef(false);
	useEffect(() => {
		if (fetching) {
			hasStartedInitializing.current = true;
		}
	}, [fetching]);

	// delivery methods change total price so we want to wait until the change is done
	const isLoading = changingBillingCountry || fetching || checkoutDeliveryMethodUpdate === "loading";

	// True once initialization has settled with nothing usable to show: either
	// paymentGatewaysInitialize returned no gateway with a component wired for
	// it at all, or every gateway it did return failed its own init webhook
	// (the 2026-09-16 incident's actual shape — confirmed against Saleor's
	// PaymentGatewayInitialize.prepare_response(): a failed init is never
	// omitted, it comes back as an entry with a populated `errors` array, so
	// checking gatewaysWithDefinedComponent alone would miss this — see
	// usableGateways above). Logged once per mount so a retry (a fresh mount,
	// see PaymentMethods above) can log again if it still fails.
	const hasNoUsableGateway =
		hasStartedInitializing.current && !isLoading && !isRedirectReturn && usableGateways.length === 0;
	const loggedErrorRef = useRef(false);

	useEffect(() => {
		if (!hasNoUsableGateway || loggedErrorRef.current) {
			return;
		}
		loggedErrorRef.current = true;
		console.error("[checkout-payment] no usable payment gateway after initialization", {
			reason: gatewaysWithDefinedComponent.length === 0 ? "noGatewaysReturned" : "allGatewaysErrored",
			// Ids and error codes only — never the free-form `message` field,
			// which is app-authored text, not something this client should log.
			gateways: gatewaysWithDefinedComponent.map((gateway) => ({
				id: gateway.id,
				codes: (gateway.errors ?? []).map((error) => error.code),
			})),
		});
	}, [hasNoUsableGateway, gatewaysWithDefinedComponent]);

	// Mixed case: at least one gateway is usable, but not all of them are —
	// the customer still gets a working Payment step, but this is worth
	// surfacing (once) since it means one gateway is silently unavailable
	// rather than genuinely absent.
	const hasPartialFailure =
		!isLoading && !isRedirectReturn && usableGateways.length > 0 && excludedGateways.length > 0;
	const loggedWarnRef = useRef(false);

	useEffect(() => {
		if (!hasPartialFailure || loggedWarnRef.current) {
			return;
		}
		loggedWarnRef.current = true;
		console.warn("[checkout-payment] some payment gateways failed initialization", {
			excluded: excludedGateways.map((gateway) => ({
				id: gateway.id,
				codes: (gateway.errors ?? []).map((error) => error.code),
			})),
		});
	}, [hasPartialFailure, excludedGateways]);

	if (isLoading) {
		return <PaymentSectionSkeleton />;
	}

	if (hasNoUsableGateway) {
		return (
			<div
				role="alert"
				data-testid="paymentGatewaysUnavailable"
				className="mt-4 rounded-xl border border-s-4 border-status-warning/30 border-s-status-warning bg-status-warning/5 p-4 shadow-sm"
			>
				<p className="font-semibold text-content-primary">{payment.gatewaysUnavailableTitle}</p>
				<p className="mt-1 text-sm text-content-secondary">{payment.gatewaysUnavailableMessage}</p>
				<div className="mt-3 flex flex-wrap gap-3">
					<Button variant="primary" label={readiness.tryAgain} onClick={onRetry} />
					<a
						href={WHATSAPP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded border border-line-default px-4 font-semibold text-content-primary transition-colors duration-200 hover:bg-surface-sunken"
					>
						{payment.contactWhatsApp}
					</a>
				</div>
			</div>
		);
	}

	const selectedGateway = usableGateways.find(({ id }) => id === selectedGatewayId);
	// gateway.id matches one of paymentMethodToComponent's keys by construction
	// (usableGateways is a subset of gatewaysWithDefinedComponent, itself
	// filtered against that same object) — TypeScript can't see that
	// relationship through the .find() lookup.
	const SelectedComponent = selectedGateway
		? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			paymentMethodToComponent[selectedGateway.id as keyof typeof paymentMethodToComponent]
		: undefined;

	return (
		<div className="flex flex-col gap-y-4">
			{usableGateways.length > 1 && (
				<div role="radiogroup" aria-label={payment.title} className="flex flex-col gap-y-2">
					{usableGateways.map((gateway) => {
						const isSelected = gateway.id === selectedGatewayId;
						const { icon, label, description } = getGatewayDisplayInfo(gateway.id);

						return (
							<label
								key={gateway.id}
								className={clsx(
									"relative flex cursor-pointer flex-row items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150",
									"border-line-default hover:border-brand-primary/60",
									{ "border-2 border-brand-primary bg-brand-primary/5 shadow-sm": isSelected },
								)}
							>
								<input
									type="radio"
									name="paymentMethod"
									value={gateway.id}
									checked={isSelected}
									onChange={() => setSelectedGatewayId(gateway.id)}
									className="h-4 w-4 shrink-0 border-line-default text-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-30 focus:ring-offset-0"
								/>
								<span aria-hidden="true" className="text-xl leading-none">
									{icon}
								</span>
								<span className="flex flex-col">
									<span className="font-medium text-content-primary">{label}</span>
									{description && <span className="text-sm text-content-secondary">{description}</span>}
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
