"use client";

import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Button } from "@/ui/components/Button";
import { REJECTION_NOTE_MAX_LENGTH, type ReturnStatus } from "@/lib/returns/returnCodes";
import {
	markReturnRefunded,
	rejectReturnRequest,
	scheduleReturnPickup,
	type AdminReturnResult,
} from "@/app/[locale]/[channel]/(main)/admin/returns/actions";

type Props = {
	orderId: string;
	status: ReturnStatus;
	channel: string;
	/** "YYYY-MM-DDTHH:mm" in UAE time, computed server-side. */
	minPickupValue: string;
	currentPickupValue: string;
	refundedInSaleorLabel: string | null;
};

const fieldClass =
	"w-full rounded-lg border border-line-default bg-surface-base px-4 py-3 text-sm text-content-primary outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60";

const cardClass = "flex flex-col gap-3 rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle sm:p-6";

/**
 * Owner decisions for one return. Every button calls a server action that
 * re-checks the admin allowlist and the order's CURRENT state before writing —
 * this component only decides which forms to offer. The page re-renders from
 * the server after each successful action (revalidatePath in the action).
 */
export function AdminReturnActions({
	orderId,
	status,
	channel,
	minPickupValue,
	currentPickupValue,
	refundedInSaleorLabel,
}: Props) {
	const t = useTranslations("returnsAdmin");
	const locale = useLocale();
	const id = useId();
	const [pickup, setPickup] = useState(currentPickupValue);
	const [note, setNote] = useState("");
	const [message, setMessage] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(
		null,
	);
	const [pendingAction, setPendingAction] = useState<"approve" | "reject" | "refund" | null>(null);
	const [isPending, startTransition] = useTransition();

	function run(action: "approve" | "reject" | "refund", call: () => Promise<AdminReturnResult>) {
		setMessage(null);
		setPendingAction(action);
		startTransition(async () => {
			const result = await call();
			if (result.ok) {
				setMessage(
					result.emailSent || action === "refund"
						? { tone: "success", text: t("saved") }
						: { tone: "warning", text: t("emailFailedNotice") },
				);
				setNote("");
			} else {
				setMessage({ tone: "danger", text: t(`errors.${result.error}`) });
			}
			setPendingAction(null);
		});
	}

	function handleApprove(e: React.FormEvent) {
		e.preventDefault();
		if (!pickup) {
			setMessage({ tone: "danger", text: t("errors.pickup_invalid") });
			return;
		}
		run("approve", () => scheduleReturnPickup({ orderId, pickupAt: pickup, locale, channel }));
	}

	function handleReject(e: React.FormEvent) {
		e.preventDefault();
		if (!note.trim()) {
			setMessage({ tone: "danger", text: t("errors.note_required") });
			return;
		}
		run("reject", () => rejectReturnRequest({ orderId, note, locale, channel }));
	}

	const canSchedule = status === "requested" || status === "pickup_scheduled";
	const canReject = status === "requested";
	const canMarkRefunded = status === "item_received";

	if (!canSchedule && !canReject && !canMarkRefunded && !message) return null;

	return (
		<div className="flex flex-col gap-6">
			{message && (
				<p
					role={message.tone === "danger" ? "alert" : "status"}
					className={clsx(
						"rounded-lg px-4 py-3 text-sm",
						message.tone === "success" && "bg-status-success/10 text-status-success",
						message.tone === "warning" && "bg-status-warning/10 text-status-warning",
						message.tone === "danger" && "bg-status-danger/10 text-status-danger",
					)}
				>
					{message.text}
				</p>
			)}

			{canSchedule && (
				<form onSubmit={handleApprove} className={cardClass}>
					<h2 className="text-base font-semibold text-content-primary">
						{status === "requested" ? t("approveTitle") : t("rescheduleTitle")}
					</h2>
					<label htmlFor={`${id}-pickup`} className="text-sm font-medium text-content-primary">
						{t("pickupLabel")}
					</label>
					{/* Native picker on phones, unambiguous in both locales; the value is a
					    timezone-less wall-clock time the server always reads as UAE time. */}
					<input
						id={`${id}-pickup`}
						type="datetime-local"
						dir="ltr"
						value={pickup}
						min={minPickupValue}
						onChange={(e) => setPickup(e.target.value)}
						disabled={isPending}
						required
						className={fieldClass}
					/>
					<Button
						type="submit"
						variant="primary"
						size="lg"
						loading={pendingAction === "approve"}
						disabled={isPending}
					>
						{status === "requested" ? t("approveButton") : t("rescheduleButton")}
					</Button>
				</form>
			)}

			{canReject && (
				<form onSubmit={handleReject} className={cardClass}>
					<h2 className="text-base font-semibold text-content-primary">{t("rejectTitle")}</h2>
					<label htmlFor={`${id}-note`} className="text-sm font-medium text-content-primary">
						{t("rejectNoteLabel")}
					</label>
					<textarea
						id={`${id}-note`}
						dir={locale === "ar" ? "rtl" : "auto"}
						rows={4}
						value={note}
						maxLength={REJECTION_NOTE_MAX_LENGTH}
						onChange={(e) => setNote(e.target.value)}
						disabled={isPending}
						required
						placeholder={t("rejectNotePlaceholder")}
						className={clsx(fieldClass, "resize-none")}
					/>
					<Button
						type="submit"
						variant="secondary"
						size="lg"
						loading={pendingAction === "reject"}
						disabled={isPending}
						className="text-status-danger"
					>
						{t("rejectButton")}
					</Button>
				</form>
			)}

			{canMarkRefunded && (
				<div className={cardClass}>
					<h2 className="text-base font-semibold text-content-primary">{t("refundTitle")}</h2>
					<p className="text-sm text-content-secondary">{t("refundInstructions")}</p>
					{refundedInSaleorLabel && (
						<p className="text-sm font-medium text-status-success">
							{t("refundedInSaleor", { amount: refundedInSaleorLabel })}
						</p>
					)}
					<Button
						type="button"
						variant="primary"
						size="lg"
						loading={pendingAction === "refund"}
						disabled={isPending}
						onClick={() => run("refund", () => markReturnRefunded({ orderId, locale, channel }))}
					>
						{t("markRefundedButton")}
					</Button>
				</div>
			)}
		</div>
	);
}
