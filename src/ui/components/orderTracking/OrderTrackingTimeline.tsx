import { Package, ClipboardCheck, Truck, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import type { OrderTrackingStage } from "@/lib/orderTracking/resolveStage";

const STEPS = [
	{ stage: 1, icon: ClipboardCheck, labelKey: "stage1Placed" },
	{ stage: 2, icon: Package, labelKey: "stage2Preparing" },
	{ stage: 3, icon: Truck, labelKey: "stage3OutForDelivery" },
	{ stage: 4, icon: CheckCircle2, labelKey: "stage4Delivered" },
] as const;

export function OrderTrackingTimeline({ currentStage }: { currentStage: OrderTrackingStage }) {
	const t = useTranslations("orderTracking");

	return (
		<ol className="flex w-full items-start">
			{STEPS.map((step, index) => {
				const isComplete = step.stage <= currentStage;
				const isCurrent = step.stage === currentStage;
				const Icon = step.icon;

				return (
					<li key={step.stage} className="flex flex-1 flex-col items-center last:flex-none">
						<div className="flex w-full items-center">
							<span
								className={clsx(
									"flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 transition-colors",
									isComplete
										? "bg-brand-primary text-content-inverse ring-brand-primary"
										: "bg-surface-base text-content-secondary ring-line-default",
									isCurrent && "ring-4 ring-brand-primary/30",
								)}
								aria-hidden="true"
							>
								<Icon className="h-5 w-5" />
							</span>
							{index < STEPS.length - 1 && (
								<span
									className={clsx(
										"mx-2 h-0.5 flex-1 transition-colors",
										step.stage < currentStage ? "bg-brand-primary" : "bg-line-default",
									)}
								/>
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
					</li>
				);
			})}
		</ol>
	);
}
