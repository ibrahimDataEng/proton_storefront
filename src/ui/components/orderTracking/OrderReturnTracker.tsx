import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Check, XCircle } from "lucide-react";
import { type ReturnStatus } from "@/lib/returns/returnCodes";

const STEPS = [
	{ status: "requested", labelKey: "returnStepRequested" },
	{ status: "pickup_scheduled", labelKey: "returnStepPickupScheduled" },
	{ status: "item_received", labelKey: "returnStepItemReceived" },
	{ status: "refunded", labelKey: "returnStepRefunded" },
] as const;

type Props = {
	status: ReturnStatus;
	/** Pre-formatted UAE time; shown only while the pickup is scheduled. */
	pickupLabel: string | null;
};

/** Return panel on the tracking page — a server component, no client JS. */
export function OrderReturnTracker({ status, pickupLabel }: Props) {
	const t = useTranslations("orderTracking");

	if (status === "rejected") {
		return (
			<div className="flex items-start gap-3 rounded-xl bg-status-danger/10 p-4">
				<XCircle className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" aria-hidden="true" />
				<div>
					<p className="font-semibold text-content-primary">{t("returnRejectedTitle")}</p>
					<p className="mt-1 text-sm text-content-secondary">{t("returnRejectedBody")}</p>
				</div>
			</div>
		);
	}

	const currentIndex = STEPS.findIndex((step) => step.status === status);

	return (
		<div>
			<h2 className="mb-4 text-base font-semibold text-content-primary">{t("returnTitle")}</h2>
			<ol className="flex flex-col gap-3">
				{STEPS.map((step, index) => {
					const isComplete = index <= currentIndex;
					const isCurrent = index === currentIndex;
					return (
						<li
							key={step.status}
							className="flex items-center gap-3"
							aria-current={isCurrent ? "step" : undefined}
						>
							<span
								className={clsx(
									"flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2",
									isComplete
										? "bg-brand-primary text-content-inverse ring-brand-primary"
										: "bg-surface-base text-content-secondary ring-line-default",
								)}
								aria-hidden="true"
							>
								{isComplete ? <Check className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
							</span>
							<span
								className={clsx(
									"text-sm",
									isCurrent ? "font-semibold text-content-primary" : "text-content-secondary",
								)}
							>
								{t(step.labelKey)}
							</span>
						</li>
					);
				})}
			</ol>

			{status === "requested" && (
				<p className="mt-4 text-sm text-content-secondary">{t("returnRequestedBody")}</p>
			)}
			{status === "pickup_scheduled" && pickupLabel && (
				<p className="mt-4 rounded-lg bg-surface-sunken px-4 py-3 text-sm font-medium text-content-primary">
					{t("returnPickupAt", { time: pickupLabel })}
				</p>
			)}
			{status === "refunded" && (
				<p className="mt-4 text-sm text-content-secondary">{t("returnRefundedBody")}</p>
			)}
		</div>
	);
}
