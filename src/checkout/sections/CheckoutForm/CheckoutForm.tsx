import { Suspense, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Button } from "@/checkout/components/Button";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

type Step = "contact" | "shipping" | "payment";

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

	const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);
	const [currentStep, setCurrentStep] = useState<Step>("contact");
	const [direction, setDirection] = useState<"forward" | "back">("forward");

	const goNext = (next: Step) => {
		setDirection("forward");
		setCurrentStep(next);
	};

	const goBack = (prev: Step) => {
		setDirection("back");
		setCurrentStep(prev);
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
						onClick={() => goNext("payment")}
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
