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
	const { wizard } = useCheckoutMessages();
	const locale = useLocale();

	const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);
	const [currentStep, setCurrentStep] = useState<Step>("contact");
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

	const goNext = (next: Step) => {
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
					return;
				}
			}
		}
		// Validate all other required fields via native HTML5 constraint API
		const form = document.querySelector("form");
		if (form && !form.checkValidity()) {
			form.reportValidity();
			return;
		}
		setDirection("forward");
		setCurrentStep(next);
	};

	const goBack = (prev: Step) => {
		setDirection("back");
		setCurrentStep(prev);
	};

	const handleContinueToPayment = () => {
		const items = getCheckoutItems(checkout);
		const value = checkout?.totalPrice?.gross?.amount ?? 0;
		const selectedShippingMethod = checkout?.shippingMethods?.find(
			(method) => method.id === checkout?.deliveryMethod?.id,
		);
		trackAddShippingInfo({ value, items, shipping_tier: selectedShippingMethod?.name });
		trackAddPaymentInfo({ value, items });
		goNext("payment");
	};

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
							onClick={() => goNext("shipping")}
							variant="primary"
							label={
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
						onClick={handleContinueToPayment}
						variant="primary"
						label={
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
					<PaymentSection />
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
