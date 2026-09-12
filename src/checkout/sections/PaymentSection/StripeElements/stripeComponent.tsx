"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useEffect, useMemo } from "react";
import { CheckoutForm } from "./stripeElementsForm";
import { stripeGatewayId } from "./types";
import { useTransactionInitializeMutation } from "@/checkout/graphql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useErrorMessages } from "@/checkout/hooks/useErrorMessages";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useApiErrorMessages } from "@/checkout/sections/PaymentSection/errorMessages";
import { replaceUrl } from "@/checkout/lib/utils/url";

interface StripeComponentProps {
	// PaymentMethods.tsx passes each gateway's own paymentGatewayInitialize
	// config through as `config` (same convention AdyenDropIn uses) — the
	// shared ParsedStripeGateway type types `data` as `{}` though, so this
	// component declares its own narrower, locally-checked shape instead of
	// fighting that type (PaymentMethods.tsx already suppresses the mismatch
	// with its own `@ts-expect-error` at the call site).
	config: { data: Record<string, unknown> };
}

export const StripeComponent = ({ config }: StripeComponentProps) => {
	const { checkout } = useCheckout();
	const apiErrorMessages = useApiErrorMessages();
	const [transactionInitializeResult, transactionInitialize] = useTransactionInitializeMutation();
	const transactionData = transactionInitializeResult.data?.transactionInitialize;
	const stripeClientSecret = (
		transactionData?.data as undefined | { paymentIntent?: { stripeClientSecret?: string } }
	)?.paymentIntent?.stripeClientSecret;
	const transactionId = transactionData?.transaction?.id;

	// The real field name proton-payments (com.tawasiplus.stripe_payment)
	// returns from paymentGatewayInitialize — confirmed against its actual
	// deployed source, not Saleor's generic docs example.
	const stripePublishableKey =
		typeof config.data.stripePublishableKey === "string" ? config.data.stripePublishableKey : undefined;

	const { showCustomErrors } = useAlerts();
	const { errorMessages: commonErrorMessages } = useErrorMessages(apiErrorMessages);

	useEffect(() => {
		transactionInitialize({
			checkoutId: checkout.id,
			paymentGateway: {
				id: stripeGatewayId,
				data: {
					automatic_payment_methods: {
						enabled: true,
					},
				},
			},
		}).catch((err) => {
			console.error(err);
			showCustomErrors([{ message: commonErrorMessages.somethingWentWrong }]);
		});
	}, [checkout.id, commonErrorMessages.somethingWentWrong, showCustomErrors, transactionInitialize]);

	// Persisted in the URL (same pattern AdyenDropIn already uses) so it
	// survives Stripe's own return_url redirect — CheckoutForm needs this id
	// to call transactionProcess after the user comes back from a redirect,
	// at which point this component's own React state no longer exists.
	useEffect(() => {
		if (transactionId) {
			replaceUrl({ query: { transaction: transactionId } });
		}
	}, [transactionId]);

	const stripePromise = useMemo(
		() => stripePublishableKey && loadStripe(stripePublishableKey),
		[stripePublishableKey],
	);

	if (!stripePromise || !stripeClientSecret || !transactionId) {
		return null;
	}

	return (
		<Elements
			options={{ clientSecret: stripeClientSecret, appearance: { theme: "stripe" } }}
			stripe={stripePromise}
		>
			<CheckoutForm />
		</Elements>
	);
};
