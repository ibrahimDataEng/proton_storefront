"use client";

import { Package, ClipboardCheck, Truck, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";
import type { OrderTrackingStage } from "@/lib/orderTracking/resolveStage";

const STEPS = [
	{ stage: 1, icon: ClipboardCheck, labelKey: "stage1Placed" },
	{ stage: 2, icon: Package, labelKey: "stage2Preparing" },
	{ stage: 3, icon: Truck, labelKey: "stage3OutForDelivery" },
	{ stage: 4, icon: CheckCircle2, labelKey: "stage4Delivered" },
] as const;

const STEP_VARIANTS = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0 },
};

export function OrderTrackingTimeline({ currentStage }: { currentStage: OrderTrackingStage }) {
	const t = useTranslations("orderTracking");
	const locale = useLocale();
	const isRtl = locale === "ar";
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.ol
			className="flex w-full items-start"
			initial="hidden"
			animate="visible"
			variants={{ visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.15 } } }}
		>
			{STEPS.map((step, index) => {
				const isComplete = step.stage <= currentStage;
				const isCurrent = step.stage === currentStage;
				const isSegmentFilled = step.stage < currentStage;
				const Icon = step.icon;

				return (
					<motion.li
						key={step.stage}
						className="flex flex-1 flex-col items-center last:flex-none"
						variants={STEP_VARIANTS}
						transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
					>
						<div className="flex w-full items-center">
							<span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
								{/* Live indicator — current stage only, stays still under reduced motion */}
								{isCurrent && !prefersReducedMotion && (
									<motion.span
										className="absolute inset-0 rounded-full bg-brand-primary/30"
										aria-hidden="true"
										animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
										transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
									/>
								)}
								<span
									className={clsx(
										"relative flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-colors",
										isComplete
											? "bg-brand-primary text-content-inverse ring-brand-primary"
											: "bg-surface-base text-content-secondary ring-line-default",
										isCurrent && "ring-4 ring-brand-primary/30",
									)}
									aria-hidden="true"
								>
									<Icon className="h-5 w-5" />
								</span>
							</span>
							{index < STEPS.length - 1 && (
								<span className="relative mx-2 h-0.5 flex-1 overflow-hidden bg-line-default">
									{/* Fill grows from the reading-direction start, not a hardcoded physical left —
									    transform-origin has no logical-property form, so this is computed from
									    locale the same way AuthFormWrapper's getSlideVariants(isRtl) does. */}
									<motion.span
										className="absolute inset-0 bg-brand-primary"
										style={{ transformOrigin: isRtl ? "100%" : "0%" }}
										initial={{ scaleX: 0 }}
										animate={{ scaleX: isSegmentFilled ? 1 : 0 }}
										transition={{
											duration: prefersReducedMotion ? 0 : 0.5,
											ease: "easeInOut",
											delay: prefersReducedMotion ? 0 : 0.15 * (index + 1),
										}}
									/>
								</span>
							)}
						</div>
						<span
							className={clsx(
								"mt-2 max-w-[6rem] text-center text-xs font-medium",
								isComplete ? "text-content-primary" : "text-content-secondary",
							)}
						>
							{t(step.labelKey)}
						</span>
					</motion.li>
				);
			})}
		</motion.ol>
	);
}
