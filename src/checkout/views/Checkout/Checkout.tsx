import { Suspense, useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLocale } from "next-intl";
import { EmptyCartPage } from "../EmptyCartPage";
import { PageNotFound } from "../PageNotFound";
import { useUser } from "../../hooks/useUser";
import { CheckoutDiscovery } from "./CheckoutDiscovery";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { type CheckoutStep, CheckoutForm, CheckoutFormSkeleton } from "@/checkout/sections/CheckoutForm";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { CheckoutSkeleton } from "@/checkout/views/Checkout/CheckoutSkeleton";

export const Checkout = () => {
	const locale = useLocale();
	const { checkout, fetching: fetchingCheckout } = useCheckout();
	const { loading: isAuthenticating } = useUser();

	// The Stripe PaymentIntent is created for Saleor's total when the Payment
	// step mounts and is never re-created, so the summary must not be able to
	// change that total there (front_store-zxf). A redirect return lands
	// straight on Payment (see CheckoutForm), so it starts locked.
	const [isPaymentStep, setIsPaymentStep] = useState(() => !!getQueryParams().processingPayment);
	const handleStepChange = useCallback((step: CheckoutStep) => setIsPaymentStep(step === "payment"), []);

	const isCheckoutInvalid = !fetchingCheckout && !checkout && !isAuthenticating;

	const isInitiallyAuthenticating = isAuthenticating && !checkout;

	const isEmptyCart = checkout && !checkout.lines.length;

	return isCheckoutInvalid ? (
		<PageNotFound />
	) : isInitiallyAuthenticating ? (
		<CheckoutSkeleton />
	) : (
		<ErrorBoundary FallbackComponent={PageNotFound}>
			<div className="page" dir={locale === "ar" ? "rtl" : "ltr"}>
				{isEmptyCart ? (
					<EmptyCartPage />
				) : (
					<div className="grid min-h-screen grid-cols-1 gap-8 gap-x-16 lg:grid-cols-2">
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
