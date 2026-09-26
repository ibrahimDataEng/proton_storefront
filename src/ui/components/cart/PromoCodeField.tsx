"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle, X } from "lucide-react";
import { clsx } from "clsx";
import { applyPromoCode, removePromoCode } from "@/app/[locale]/[channel]/(main)/cart/actions";
import { formatMoney } from "@/lib/utils";

interface Props {
	checkoutId: string;
	appliedVoucherCode?: string | null;
	discount?: { amount: number; currency: string } | null;
}

type ApplyStatus = "idle" | "loading" | "error";

export function PromoCodeField({ checkoutId, appliedVoucherCode, discount }: Props) {
	const t = useTranslations("cart");
	const [code, setCode] = useState("");
	const [applyStatus, setApplyStatus] = useState<ApplyStatus>("idle");
	const [isApplied, setIsApplied] = useState(Boolean(appliedVoucherCode));
	const [isRemoving, setIsRemoving] = useState(false);
	const [activeCode, setActiveCode] = useState<string | null>(appliedVoucherCode ?? null);
	const [activeDiscount, setActiveDiscount] = useState<{ amount: number; currency: string } | null>(
		discount ?? null,
	);
	const [errorKey, setErrorKey] = useState<string | null>(null);
	const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
		};
	}, []);

	async function handleApply() {
		const trimmed = code.trim();
		if (!trimmed || applyStatus === "loading") return;
		setApplyStatus("loading");
		setErrorKey(null);

		const result = await applyPromoCode(checkoutId, trimmed);
		if (!result.ok) {
			setApplyStatus("error");
			setErrorKey(result.error ?? "unknown");
			errorTimerRef.current = setTimeout(() => {
				setApplyStatus("idle");
				setErrorKey(null);
			}, 4000);
			return;
		}
		setActiveCode(result.voucherCode ?? trimmed);
		setActiveDiscount(result.discount ?? null);
		setCode("");
		setApplyStatus("idle");
		setIsApplied(true);
	}

	async function handleRemove() {
		if (!activeCode) return;
		setIsRemoving(true);
		const result = await removePromoCode(checkoutId, activeCode);
		setIsRemoving(false);
		if (!result.ok) return;
		setActiveCode(null);
		setActiveDiscount(null);
		setIsApplied(false);
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") void handleApply();
	}

	const errorMessage =
		errorKey === "promoInvalid" || errorKey === "unknown"
			? t("promoInvalid")
			: errorKey === "promoNotApplicable"
				? t("promoNotApplicable")
				: null;

	return (
		<AnimatePresence mode="wait" initial={false}>
			{isApplied ? (
				<m.div
					key="applied"
					initial={{ opacity: 0, scale: 0.97 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.97 }}
					transition={{ duration: 0.2 }}
					className="flex items-center justify-between gap-3 rounded-xl border border-brand-primary/30 bg-surface-raised p-3"
				>
					<div className="flex min-w-0 items-center gap-2">
						<CheckCircle className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
						<div className="min-w-0">
							<p className="text-sm font-medium text-content-primary">
								{activeCode}
								{activeDiscount && activeDiscount.amount > 0 && (
									<span className="ms-2 text-brand-primary">
										−{formatMoney(activeDiscount.amount, activeDiscount.currency)}
									</span>
								)}
							</p>
							<p className="text-xs text-content-secondary">{t("promoApplied")}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => void handleRemove()}
						disabled={isRemoving}
						aria-label={t("promoRemove")}
						className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-content-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
					>
						{isRemoving ? (
							<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							<X className="h-4 w-4" aria-hidden="true" />
						)}
					</button>
				</m.div>
			) : (
				<m.div
					key="input"
					initial={{ opacity: 0, scale: 0.97 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.97 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col gap-1.5"
				>
					<div className="flex">
						<input
							type="text"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={t("promoCode")}
							disabled={applyStatus === "loading"}
							aria-label={t("promoCode")}
							className={clsx(
								"min-w-0 flex-1 rounded-s-xl border border-e-0 bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary",
								"focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
								"disabled:cursor-not-allowed disabled:opacity-50",
								applyStatus === "error" ? "border-red-400" : "border-line-default",
							)}
						/>
						<button
							type="button"
							onClick={() => void handleApply()}
							disabled={!code.trim() || applyStatus === "loading"}
							className="rounded-e-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{applyStatus === "loading" ? (
								<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							) : (
								t("promoApply")
							)}
						</button>
					</div>
					{applyStatus === "error" && errorMessage && (
						<m.p
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-xs text-red-600"
							role="alert"
						>
							{errorMessage}
						</m.p>
					)}
				</m.div>
			)}
		</AnimatePresence>
	);
}
