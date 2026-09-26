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
		<nav aria-label="Checkout progress" className="mb-8 w-full border-b border-line-subtle py-6">
			<ol className="flex w-full items-start">
				{steps.map((step, index) => {
					const isCompleted = index < stepIndex;
					const isActive = index === stepIndex;

					return (
						<li key={step.id} className="flex flex-1 flex-col items-center">
							<div className="flex w-full items-center">
								{/* Left connector */}
								{index > 0 && (
									<div
										className={[
											"h-0.5 flex-1 rounded-full transition-colors duration-500",
											isCompleted || isActive ? "bg-brand-primary" : "bg-line-default",
										].join(" ")}
									/>
								)}

								{/* Step circle */}
								<div
									className={[
										"flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
										isCompleted
											? "border-2 border-brand-primary bg-brand-primary/10 text-brand-primary"
											: isActive
												? "bg-brand-primary text-content-inverse shadow-raised"
												: "border border-line-default bg-surface-raised text-content-secondary",
									].join(" ")}
									aria-current={isActive ? "step" : undefined}
								>
									{isCompleted ? (
										<svg
											className="h-4 w-4"
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
									<div
										className={[
											"h-0.5 flex-1 rounded-full transition-colors duration-500",
											isCompleted ? "bg-brand-primary" : "bg-line-default",
										].join(" ")}
									/>
								)}
							</div>

							{/* Step label */}
							<span
								className={[
									"mt-2 hidden text-xs font-medium md:block",
									isActive
										? "text-brand-primary"
										: isCompleted
											? "text-content-secondary"
											: "text-content-secondary/60",
								].join(" ")}
							>
								{step.label}
							</span>
							{/* Mobile: show only active step label */}
							{isActive && (
								<span
									className={[
										"mt-2 text-xs font-medium text-brand-primary md:hidden",
										// The end steps have no connector on their outer side, so their circle sits at
										// the li edge; anchor the label to it (logical, mirrors in RTL).
										index === 0 ? "self-start" : index === steps.length - 1 ? "self-end" : "",
									].join(" ")}
								>
									{step.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
};
