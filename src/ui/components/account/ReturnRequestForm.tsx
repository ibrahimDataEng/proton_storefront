"use client";

import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Button } from "@/ui/components/Button";
import { RETURN_DETAILS_MAX_LENGTH, RETURN_REASONS, type ReturnReason } from "@/lib/returns/returnCodes";
import { requestOrderReturn } from "@/app/[locale]/[channel]/(main)/account/returnActions";

type Props = {
	orderId: string;
	orderNumber: string;
	channel: string;
	onCancel: () => void;
	onSubmitted: () => void;
};

const fieldClass =
	"w-full rounded-lg border bg-surface-base text-sm text-content-primary outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60";

/**
 * Inline (not a modal) on purpose: it opens inside the order card, so the
 * order's own number/items stay visible while the customer picks a reason, it
 * needs no focus trap or scroll lock, and a phone's on-screen keyboard can't
 * cover a fixed-position dialog's submit button. Same expand-in-place pattern
 * the card's own "View details" accordion already uses.
 */
export function ReturnRequestForm({ orderId, orderNumber, channel, onCancel, onSubmitted }: Props) {
	const t = useTranslations("account.returnRequest");
	const tReasons = useTranslations("account.returnReasons");
	const locale = useLocale();
	const id = useId();
	const [reason, setReason] = useState<ReturnReason | "">("");
	const [details, setDetails] = useState("");
	const [fieldErrors, setFieldErrors] = useState<{ reason?: string; details?: string }>({});
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const detailsRequired = reason === "other";

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const nextErrors: typeof fieldErrors = {};
		if (!reason) nextErrors.reason = t("reasonRequired");
		if (detailsRequired && !details.trim()) nextErrors.details = t("detailsRequired");
		setFieldErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0 || !reason) return;

		setError(null);
		startTransition(async () => {
			const result = await requestOrderReturn({ orderId, reason, details, locale, channel });
			if (result.ok) {
				onSubmitted();
			} else {
				setError(t(`errors.${result.error}`));
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 border-t border-line-subtle p-5">
			<p className="text-sm font-semibold text-content-primary">{t("formTitle", { number: orderNumber })}</p>

			<div className="flex flex-col gap-1.5">
				<label htmlFor={`${id}-reason`} className="text-sm font-medium text-content-primary">
					{t("reasonLabel")}
				</label>
				<select
					id={`${id}-reason`}
					value={reason}
					onChange={(e) => setReason(e.target.value as ReturnReason | "")}
					disabled={isPending}
					required
					aria-invalid={Boolean(fieldErrors.reason)}
					aria-describedby={fieldErrors.reason ? `${id}-reason-error` : undefined}
					className={clsx(
						fieldClass,
						"bg-[length:1.25em_1.25em] bg-[right_0.75rem_center] bg-no-repeat py-3 pe-10 ps-4 rtl:bg-[left_0.75rem_center]",
						fieldErrors.reason ? "border-status-danger" : "border-line-default",
					)}
				>
					<option value="" disabled>
						{t("reasonPlaceholder")}
					</option>
					{RETURN_REASONS.map((code) => (
						<option key={code} value={code}>
							{tReasons(code)}
						</option>
					))}
				</select>
				{fieldErrors.reason && (
					<p id={`${id}-reason-error`} className="text-xs text-status-danger">
						{fieldErrors.reason}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-1.5">
				<label htmlFor={`${id}-details`} className="text-sm font-medium text-content-primary">
					{detailsRequired ? t("detailsLabel") : t("detailsOptionalLabel")}
				</label>
				<textarea
					id={`${id}-details`}
					dir={locale === "ar" ? "rtl" : "auto"}
					rows={4}
					value={details}
					maxLength={RETURN_DETAILS_MAX_LENGTH}
					onChange={(e) => setDetails(e.target.value)}
					disabled={isPending}
					required={detailsRequired}
					placeholder={t("detailsPlaceholder")}
					aria-invalid={Boolean(fieldErrors.details)}
					aria-describedby={fieldErrors.details ? `${id}-details-error` : undefined}
					className={clsx(
						fieldClass,
						"resize-none px-4 py-3",
						fieldErrors.details ? "border-status-danger" : "border-line-default",
					)}
				/>
				{fieldErrors.details && (
					<p id={`${id}-details-error`} className="text-xs text-status-danger">
						{fieldErrors.details}
					</p>
				)}
			</div>

			{error && (
				<p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
					{error}
				</p>
			)}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Button type="submit" variant="primary" size="md" loading={isPending} className="sm:flex-1">
					{t("submit")}
				</Button>
				<Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={isPending}>
					{t("cancel")}
				</Button>
			</div>
		</form>
	);
}
