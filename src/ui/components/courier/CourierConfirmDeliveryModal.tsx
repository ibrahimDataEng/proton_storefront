"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { PackageCheck } from "lucide-react";
import { Button } from "@/ui/components/Button";
import { formatMoney } from "@/lib/utils";
import { type CourierPaymentMethod } from "@/lib/courier/orderEligibility";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	orderNumber: string;
	paymentMethod: CourierPaymentMethod;
	codAmount: number;
	currency: string;
	isSubmitting: boolean;
	error: string | null;
};

export function CourierConfirmDeliveryModal({
	isOpen,
	onClose,
	onConfirm,
	orderNumber,
	paymentMethod,
	codAmount,
	currency,
	isSubmitting,
	error,
}: Props) {
	const t = useTranslations("courier");
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen) panelRef.current?.focus();
	}, [isOpen]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape" && !isSubmitting) onClose();
		},
		[isSubmitting, onClose],
	);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="courier-confirm-title"
			onKeyDown={handleKeyDown}
		>
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-hidden="true"
				onClick={() => !isSubmitting && onClose()}
			/>

			<div
				ref={panelRef}
				tabIndex={-1}
				className="relative z-10 w-full max-w-sm rounded-2xl bg-surface-base p-6 shadow-xl focus:outline-none"
			>
				<div className="flex flex-col items-center gap-3 text-center">
					<span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
						<PackageCheck className="h-6 w-6 text-brand-primary" aria-hidden="true" />
					</span>
					<h2 id="courier-confirm-title" className="text-lg font-semibold text-content-primary">
						{t("confirmTitle")}
					</h2>
					<p className="text-2xl font-bold text-content-primary">
						{t("orderNumber", { number: orderNumber })}
					</p>

					{paymentMethod === "cod" && (
						<p className="rounded-lg bg-surface-sunken px-4 py-2 text-base font-semibold text-content-primary">
							{t("collectCash", { amount: formatMoney(codAmount, currency) })}
						</p>
					)}
					{paymentMethod === "card" && <p className="text-sm text-content-secondary">{t("alreadyPaid")}</p>}
					{paymentMethod === "unknown" && (
						<p className="text-sm text-status-warning">{t("paymentUnknown")}</p>
					)}
				</div>

				{error && (
					<p
						role="alert"
						className="mt-4 rounded-md bg-status-danger/10 px-3 py-2 text-center text-sm text-status-danger"
					>
						{error}
					</p>
				)}

				<div className="mt-6 flex flex-col gap-3">
					<Button
						type="button"
						variant="primary"
						size="lg"
						className="w-full"
						loading={isSubmitting}
						onClick={onConfirm}
					>
						{t("confirmDeliveryButton")}
					</Button>
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="rounded-xl px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-sunken disabled:opacity-60"
					>
						{t("cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}
