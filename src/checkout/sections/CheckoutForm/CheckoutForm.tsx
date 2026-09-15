import { Suspense, useEffect, useRef, useState } from "react";
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
	createReadinessDeadline,
	getReadinessMessage,
	reportReadinessFailOpen,
	useCheckoutReadiness,
} from "@/checkout/hooks/useCheckoutReadiness";
import { commitMountedStepForms } from "@/checkout/hooks/useStepCommit";
import {
	trackBeginCheckout,
	trackAddShippingInfo,
	trackAddPaymentInfo,
	type GA4Item,
} from "@/lib/analytics/gtag";

export type CheckoutStep = "contact" | "shipping" | "payment";
type Step = CheckoutStep;

interface CheckoutFormProps {
	// Reports the current wizard step, e.g. so the order summary can lock itself
	// on the Payment step (front_store-zxf).
	onStepChange?: (step: CheckoutStep) => void;
}

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

export const CheckoutForm = ({ onStepChange }: CheckoutFormProps = {}) => {
	const { user } = useUser();
	const { checkout } = useCheckout();
	const { passwordResetToken } = getQueryParams();
	const { wizard, readiness } = useCheckoutMessages();
	const locale = useLocale();
	const { verify, checkoutId } = useCheckoutReadiness();
	const [verifying, setVerifying] = useState(false);
	// Most recent error toast (e.g. a save's API error), so a failed commit
	// keeps that specific message instead of a generic one.
	const lastErrorToast = useRef<string | null>(null);

	const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);
	const [currentStep, setCurrentStep] = useState<Step>(() =>
		getQueryParams().processingPayment ? "payment" : "contact",
	);
	const [direction, setDirection] = useState<"forward" | "back">("forward");
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	// Deadline of the Continue click that opened the Payment step, so the
	// Payment guard spends what's left of that click's budget instead of its own.
	const [paymentReadinessDeadline, setPaymentReadinessDeadline] = useState<number | undefined>();

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
				if (message) {
					lastErrorToast.current = message;
					setCheckoutError(message);
				}
			}
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		setCheckoutError(null);
	}, [currentStep]);

	useEffect(() => {
		onStepChange?.(currentStep);
	}, [currentStep, onStepChange]);

	// Resolves to { verifiedCheckout } when the wizard advanced (undefined when
	// the check failed open), or null when the step must not advance (the
	// reason is already shown in the error banner).
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

		// One budget for everything this click waits on: commits, the step check
		// and (when advancing to Payment) the Payment guard.
		const deadline = createReadinessDeadline();

		setCheckoutError(null);
		setVerifying(true);
		lastErrorToast.current = null;

		// Commit-on-advance (front_store-bwh): every form on this step saves its
		// current values now, and the wizard waits for those saves — autosave's
		// 2s debounce is no longer relied on for correctness. Saves that haven't
		// answered by the deadline aren't confirmed, so they block (below)
		// rather than leaving the customer on a spinner.
		let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
		const committed = await Promise.race([
			commitMountedStepForms(),
			new Promise<"timeout">((resolve) => {
				deadlineTimer = setTimeout(() => resolve("timeout"), Math.max(0, deadline - Date.now()));
			}),
		]).finally(() => clearTimeout(deadlineTimer));

		if (committed === "timeout") {
			setVerifying(false);
			setCheckoutError(readiness.verifyFailed);
			window.scrollTo({ top: 0, behavior: "smooth" });
			return null;
		}

		// Then the Phase 1 backstop: re-read the checkout from the network and
		// check the fields the next step depends on.
		const stage = next === "shipping" ? "contact" : "payment";
		const result = await verify(stage, {
			followOnSavesMounted: next === "payment",
			// Recorded below, only if this advance actually fails open.
			reportFailOpen: false,
			deadline,
		});
		setVerifying(false);

		if (result.status === "cancelled") {
			return null;
		}

		// Blocks on a failed save or a definitive answer from Saleor. If only the
		// check itself couldn't complete ("error") the wizard fails open — a
		// broken check must never be able to take checkout down.
		if (!committed || result.status === "notReady" || result.status === "checkoutGone") {
			const message =
				result.status === "notReady" || result.status === "checkoutGone"
					? getReadinessMessage(result, readiness)
					: // A save failed although Saleor still holds complete (older) data:
						// keep an API error already shown, otherwise point at the fields.
						lastErrorToast.current ?? readiness.fixHighlightedFields;
			setCheckoutError(message);
			window.scrollTo({ top: 0, behavior: "smooth" });
			return null;
		}

		if (result.status === "error") {
			const { reason, message, attempts, elapsedMs } = result;
			reportReadinessFailOpen({
				reason,
				message,
				attempts,
				elapsedMs,
				stage,
				checkoutId,
				source: "step-advance",
			});
		}

		if (next === "payment") {
			setPaymentReadinessDeadline(deadline);
		}
		setDirection("forward");
		setCurrentStep(next);
		return { verifiedCheckout: result.status === "ready" ? result.checkout : undefined };
	};

	const goBack = (prev: Step) => {
		if (verifying) {
			return;
		}
		setDirection("back");
		setCurrentStep(prev);
	};

	const handleContinueToPayment = async () => {
		const advanced = await goNext("payment");
		if (!advanced) {
			return;
		}

		// Lines can't change on the Shipping step, so the cached checkout's items
		// are accurate; value and shipping tier prefer the verified read, which
		// includes a delivery method that may have only just saved.
		const source = advanced.verifiedCheckout ?? checkout;
		const items = getCheckoutItems(checkout);
		const value = source?.totalPrice?.gross?.amount ?? 0;
		const selectedShippingMethod = source?.shippingMethods?.find(
			(method) => method.id === source?.deliveryMethod?.id,
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
					<PaymentSection onNavigateBack={goBack} readinessDeadline={paymentReadinessDeadline} />
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
