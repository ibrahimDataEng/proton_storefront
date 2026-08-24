"use client";

import { type FC } from "react";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

type Step = "contact" | "shipping" | "payment";

interface CheckoutStepperProps {
	currentStep: Step;
}

export const CheckoutStepper: FC<CheckoutStepperProps> = ({ currentStep }) => {
	const { wizard } = useCheckoutMessages();

	const steps: { id: Step; label: string }[] = [
		{ id: "contact", label: wizard.stepContact },
		{ id: "shipping", label: wizard.stepShipping },
		{ id: "payment", label: wizard.stepPayment },
	];

	const stepIndex = steps.findIndex((s) => s.id === currentStep);

	return (
		<nav aria-label="Checkout progress" className="mb-8 w-full border-b border-neutral-100 py-6">
			<ol className="flex w-full items-center">
				{steps.map((step, index) => {
					const isCompleted = index < stepIndex;
					const isActive = index === stepIndex;

					return (
						<li key={step.id} className="flex flex-1 flex-col items-center">
							<div className="flex w-full items-center">
								{/* Left connector */}
								{index > 0 && (
									<div className="h-0.5 flex-1 transition-colors duration-500">
										<div
											className="h-full transition-all duration-500"
											style={{
												backgroundColor: isCompleted || isActive ? "#2d6a4f" : "#e5e7eb",
											}}
										/>
									</div>
								)}

								{/* Step circle */}
								<div
									className={[
										"flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
										isCompleted
											? "border-2 border-[#2d6a4f] bg-[#e8f5ee]"
											: isActive
												? "bg-[#2d6a4f] text-white"
												: "border border-neutral-300 bg-white text-neutral-400",
									].join(" ")}
									aria-current={isActive ? "step" : undefined}
								>
									{isCompleted ? (
										<svg
											className="h-4 w-4 text-[#2d6a4f]"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2.5}
										>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									) : (
										<span>{index + 1}</span>
									)}
								</div>

								{/* Right connector */}
								{index < steps.length - 1 && (
									<div className="h-0.5 flex-1 transition-colors duration-500">
										<div
											className="h-full transition-all duration-500"
											style={{
												backgroundColor: isCompleted ? "#2d6a4f" : "#e5e7eb",
											}}
										/>
									</div>
								)}
							</div>

							{/* Step label */}
							<span
								className={[
									"mt-2 hidden text-xs font-medium md:block",
									isActive ? "text-[#2d6a4f]" : isCompleted ? "text-neutral-500" : "text-neutral-400",
								].join(" ")}
							>
								{step.label}
							</span>
							{/* Mobile: show only active step label */}
							{isActive && (
								<span className="mt-2 text-xs font-medium text-[#2d6a4f] md:hidden">{step.label}</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
};
