import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { useLocale } from "next-intl";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { Contact } from "@/checkout/sections/Contact";
import { DeliveryMethods } from "@/checkout/sections/DeliveryMethods";
import { ContactSkeleton } from "@/checkout/sections/Contact/ContactSkeleton";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { AddressSectionSkeleton } from "@/checkout/components/AddressSectionSkeleton";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { Divider } from "@/checkout/components";
import { UserShippingAddressSection } from "@/checkout/sections/UserShippingAddressSection";
import { GuestShippingAddressSection } from "@/checkout/sections/GuestShippingAddressSection";
import { UserBillingAddressSection } from "@/checkout/sections/UserBillingAddressSection";
import { PaymentSection, PaymentSectionSkeleton } from "@/checkout/sections/PaymentSection";
import { GuestBillingAddressSection } from "@/checkout/sections/GuestBillingAddressSection";
import { useUser } from "@/checkout/hooks/useUser";
import { CheckoutStepper } from "@/checkout/components/CheckoutStepper";
import { CheckoutErrorBanner } from "@/checkout/components/CheckoutErrorBanner";
import { Button } from "@/checkout/components/Button";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getReadinessMessage, useCheckoutReadiness } from "@/checkout/hooks/useCheckoutReadiness";
import {
	trackBeginCheckout,
	trackAddShippingInfo,
	trackAddPaymentInfo,
	type GA4Item,
} from "@/lib/analytics/gtag";

type Step = "contact" | "shipping" | "payment";

// CheckoutLineFragment carries no product id — variant.id is used as the
// GA4 item_id for checkout-step events (see Session 37 diagnostic).
function getCheckoutItems(checkout: ReturnType<typeof useCheckout>["checkout"] | undefined): GA4Item[] {
	return (checkout?.lines ?? []).map((line) => ({
		item_id: line.variant.id,
		item_name: line.variant.product.translation?.name || line.variant.product.name,
		item_category:
			line.variant.product.category?.translation?.name || line.variant.product.category?.name || undefined,
		price: line.unitPrice?.gross?.amount,
		quantity: line.quantity,
	}));
}

const slideVariants = {
	initial: (dir: "forward" | "back") => ({ opacity: 0, x: dir === "forward" ? 24 : -24 }),
	animate: { opacity: 1, x: 0 },
	exit: (dir: "forward" | "back") => ({ opacity: 0, x: dir === "forward" ? -24 : 24 }),
};

export const CheckoutForm = () => {
	const { user } = useUser();
	const { checkout } = useCheckout();
	const { passwordResetToken } = getQueryParams();
	const { wizard, readiness } = useCheckoutMessages();
	const locale = useLocale();
	const { verify } = useCheckoutReadiness();
	const [verifying, setVerifying] = useState(false);

	const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);
	const [currentStep, setCurrentStep] = useState<Step>(() =>
		getQueryParams().processingPayment ? "payment" : "contact",
	);
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	const [checkoutError, setCheckoutError] = useState<string | null>(null);

	useEffect(() => {
		if (!checkout) return;
		trackBeginCheckout({
			value: checkout.totalPrice?.gross?.amount ?? 0,
			items: getCheckoutItems(checkout),
		});
		// Fires once on mount only — not on step changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const unsubscribe = toast.onChange((payload) => {
			if (payload.type === "error" && payload.status === "added") {
				const content = payload.content;
				let message: string | null = null;
				if (typeof content === "string") {
					message = content;
				} else if (content && typeof content === "object") {
					const el = content as { props?: { children?: unknown } };
					if (el.props?.children) message = String(el.props.children);
				}
				if (message) setCheckoutError(message);
			}
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		setCheckoutError(null);
	}, [currentStep]);

	// Resolves to the server-verified checkout on success, or null when the step
	// must not advance (the reason is already shown in the error banner).
	const goNext = async (next: Exclude<Step, "contact">) => {
		if (verifying) {
			return null;
		}

		// When advancing from contact step as a guest, validate email via regex
		// (TextInput renders type="text" so native checkValidity() won't catch format errors)
		if (next === "shipping" && !user) {
			const emailInput = document.querySelector('input[name="email"]');
			if (emailInput instanceof HTMLInputElement) {
				const val = emailInput.value.trim();
				const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
				if (!emailOk) {
					emailInput.focus();
					setCheckoutError(
						locale === "ar" ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address",
					);
					window.scrollTo({ top: 0, behavior: "smooth" });
					return null;
				}
			}
		}
		// Validate all other required fields via native HTML5 constraint API
		const form = document.querySelector("form");
		if (form && !form.checkValidity()) {
			form.reportValidity();
			return null;
		}

		// What the form shows is not proof Saleor saved it (saves are debounced
		// and canceled on step unmount — front_store-9ze), so re-read the
		// checkout from the network and refuse to advance without the fields
		// the next step depends on.
		setCheckoutError(null);
		setVerifying(true);
		const result = await verify(next === "shipping" ? "contact" : "payment", {
			settleMs: 2500,
			followOnSavesMounted: next === "payment",
		});
		setVerifying(false);

		if (result.status === "cancelled" || result.status === "checkoutGone") {
			return null;
		}

		if (result.status !== "ready") {
			setCheckoutError(getReadinessMessage(result, readiness));
			window.scrollTo({ top: 0, behavior: "smooth" });
			return null;
		}

		setDirection("forward");
		setCurrentStep(next);
		return result.checkout;
	};

	const goBack = (prev: Step) => {
		if (verifying) {
			return;
		}
		setDirection("back");
		setCurrentStep(prev);
	};

	const handleContinueToPayment = async () => {
		const verifiedCheckout = await goNext("payment");
		if (!verifiedCheckout) {
			return;
		}

		// Lines can't change on the Shipping step, so the cached checkout's items
		// are accurate; value and shipping tier come from the verified read,
		// which includes the delivery method that may have only just saved.
		const items = getCheckoutItems(checkout);
		const value = verifiedCheckout.totalPrice?.gross?.amount ?? 0;
		const selectedShippingMethod = verifiedCheckout.shippingMethods?.find(
			(method) => method.id === verifiedCheckout.deliveryMethod?.id,
		);
		trackAddShippingInfo({ value, items, shipping_tier: selectedShippingMethod?.name });
		trackAddPaymentInfo({ value, items });
	};

	const checkingLabel = (
		<span className="flex items-center gap-2" aria-live="polite">
			<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
			</svg>
			{readiness.checking}
		</span>
	);

	let stepContent: React.ReactNode;

	if (currentStep === "contact") {
		stepContent = (
			<>
				<Suspense fallback={<ContactSkeleton />}>
					<Contact setShowOnlyContact={setShowOnlyContact} />
				</Suspense>
				{!showOnlyContact && (
					<div className="mt-6">
						<Button
							onClick={() => void goNext("shipping")}
							variant="primary"
							disabled={verifying}
							aria-busy={verifying}
							label={
								verifying ? (
									checkingLabel
								) : (
									<span className="flex items-center gap-2">
										{wizard.continueToShipping}
										<svg
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
										</svg>
									</span>
								)
							}
							className="w-full justify-center"
						/>
					</div>
				)}
			</>
		);
	} else if (currentStep === "shipping") {
		stepContent = (
			<>
				{checkout?.isShippingRequired && (
					<Suspense fallback={<AddressSectionSkeleton />}>
						<Divider />
						<div className="py-4" data-testid="shippingAddressSection">
							{user ? <UserShippingAddressSection /> : <GuestShippingAddressSection />}
						</div>
						{user ? <UserBillingAddressSection /> : <GuestBillingAddressSection />}
					</Suspense>
				)}
				<Suspense fallback={<DeliveryMethodsSkeleton />}>
					<DeliveryMethods collapsed={false} />
				</Suspense>
				<div className="mt-6 flex gap-3">
					<Button
						onClick={() => goBack("contact")}
						variant="secondary"
						disabled={verifying}
						label={
							<span className="flex items-center gap-2">
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
								</svg>
								{wizard.back}
							</span>
						}
						className="flex-1 justify-center"
					/>
					<Button
						onClick={() => void handleContinueToPayment()}
						variant="primary"
						disabled={verifying}
						aria-busy={verifying}
						label={
							verifying ? (
								checkingLabel
							) : (
								<span className="flex items-center gap-2">
									{wizard.continueToPayment}
									<svg
										className="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</span>
							)
						}
						className="flex-1 justify-center"
					/>
				</div>
			</>
		);
	} else {
		stepContent = (
			<>
				<Suspense fallback={<PaymentSectionSkeleton />}>
					<PaymentSection onNavigateBack={goBack} />
				</Suspense>
				<div className="mt-4">
					<Button
						onClick={() => goBack("shipping")}
						variant="secondary"
						label={
							<span className="flex items-center gap-2">
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
								</svg>
								{wizard.backToShipping}
							</span>
						}
					/>
				</div>
			</>
		);
	}

	return (
		<div className="flex flex-col items-end">
			<div className="flex w-full flex-col rounded">
				<CheckoutStepper currentStep={currentStep} />
				<CheckoutErrorBanner message={checkoutError} onDismiss={() => setCheckoutError(null)} />
				<AnimatePresence mode="wait" custom={direction}>
					<motion.div
						key={currentStep}
						custom={direction}
						variants={slideVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.25, ease: "easeInOut" }}
					>
						{stepContent}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
};
