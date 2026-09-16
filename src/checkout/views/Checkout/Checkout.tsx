import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocale } from "next-intl";
import { EmptyCartPage } from "../EmptyCartPage";
import { PageNotFound } from "../PageNotFound";
import { useUser } from "../../hooks/useUser";
import { CheckoutDiscovery } from "./CheckoutDiscovery";
import { Button } from "@/checkout/components/Button";
import { ErrorContentWrapper } from "@/checkout/components/ErrorContentWrapper";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { type CheckoutStep, CheckoutForm, CheckoutFormSkeleton } from "@/checkout/sections/CheckoutForm";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { CheckoutSkeleton } from "@/checkout/views/Checkout/CheckoutSkeleton";

export const Checkout = () => {
	const locale = useLocale();
	const { checkout, fetching: fetchingCheckout, error, isRefetchError, refetch } = useCheckout();
	const { loading: isAuthenticating } = useUser();
	const { checkoutError, readiness } = useCheckoutMessages();

	// The Stripe PaymentIntent is created for Saleor's total when the Payment
	// step mounts and is never re-created, so the summary must not be able to
	// change that total there (front_store-zxf). A redirect return lands
	// straight on Payment (see CheckoutForm), so it starts locked.
	const [isPaymentStep, setIsPaymentStep] = useState(() => !!getQueryParams().processingPayment);
	const handleStepChange = useCallback((step: CheckoutStep) => setIsPaymentStep(step === "payment"), []);

	const retry = useCallback(() => refetch({ requestPolicy: "network-only" }), [refetch]);

	// Only a server-confirmed absence (no error) means the checkout is genuinely
	// gone — an error on the query (network/HTTP/GraphQL, including the
	// automatic post-mutation refetch) must never be read as "not found"
	// (front_store-12e). useCheckout() already falls back to the last known
	// good checkout while `error` is set, so this only fires when there was
	// never any data to fall back to.
	const isCheckoutInvalid = !fetchingCheckout && !checkout && !isAuthenticating && !error;
	const isLoadError = !fetchingCheckout && !checkout && !isAuthenticating && !!error;

	const isInitiallyAuthenticating = isAuthenticating && !checkout;

	const isEmptyCart = checkout && !checkout.lines.length;

	return isCheckoutInvalid ? (
		<PageNotFound />
	) : isLoadError ? (
		<ErrorContentWrapper>
			<p className="font-semibold">{checkoutError.loadFailedTitle}</p>
			<p>{checkoutError.loadFailedDescription}</p>
			<Button ariaLabel={readiness.tryAgain} onClick={retry} variant="secondary" label={readiness.tryAgain} />
		</ErrorContentWrapper>
	) : isInitiallyAuthenticating ? (
		<CheckoutSkeleton />
	) : (
		<ErrorBoundary FallbackComponent={PageNotFound}>
			<div className="page" dir={locale === "ar" ? "rtl" : "ltr"}>
				{isRefetchError && (
					<div
						role="alert"
						className="mx-auto mb-6 max-w-screen-sm rounded-xl border border-s-4 border-status-warning/30 border-s-status-warning bg-status-warning/5 p-4 shadow-sm"
					>
						<p className="font-semibold text-content-primary">{checkoutError.bannerTitle}</p>
						<p className="mt-1 text-sm text-content-secondary">{checkoutError.bannerMessage}</p>
						<div className="mt-3">
							<Button variant="secondary" label={readiness.tryAgain} onClick={retry} />
						</div>
					</div>
				)}
				{isEmptyCart ? (
					<EmptyCartPage />
				) : (
					<div className="grid grid-cols-1 gap-8 gap-x-12 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-x-16">
						<div className={locale === "ar" ? "lg:order-2" : "lg:order-1"}>
							<div className="hidden">
								<CheckoutDiscovery checkout={checkout} />
							</div>
							<Suspense fallback={<CheckoutFormSkeleton />}>
								<CheckoutForm onStepChange={handleStepChange} />
							</Suspense>
						</div>
						<div className={locale === "ar" ? "lg:order-1" : "lg:order-2"}>
							<Suspense fallback={<SummarySkeleton />}>
								<Summary {...checkout} locked={isPaymentStep} />
							</Suspense>
						</div>
					</div>
				)}
			</div>
		</ErrorBoundary>
	);
};
