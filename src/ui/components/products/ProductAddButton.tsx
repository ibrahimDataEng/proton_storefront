"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart, Check, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { addLineToCheckout } from "@/app/[locale]/[channel]/(main)/cart/actions";

interface Props {
	selectedVariantId: string | undefined;
	productSlug: string;
	isAvailable: boolean;
	hasMultipleVariants: boolean;
	onSelectClick?: () => void;
}

const shakeVariants = {
	idle: { x: 0 },
	shake: { x: [-8, 8, -8, 8, 0] },
};

export function ProductAddButton({
	selectedVariantId,
	productSlug: _productSlug,
	isAvailable,
	hasMultipleVariants,
	onSelectClick,
}: Props) {
	const t = useTranslations("products");
	const params = useParams();
	const channel = (params.channel as string) ?? "";
	const [state, setState] = useState<"idle" | "pending" | "added" | "error">("idle");

	if (!isAvailable) {
		return (
			<button
				type="button"
				disabled
				className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-sm font-medium text-content-secondary"
			>
				{t("outOfStock")}
			</button>
		);
	}

	// No variant selected yet (multi-variant product, nothing chosen)
	if (!selectedVariantId && hasMultipleVariants) {
		return (
			<button
				type="button"
				onClick={onSelectClick}
				className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-primary px-3 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/5"
			>
				<Tag size={14} aria-hidden="true" />
				{t("selectVariant")}
			</button>
		);
	}

	const handleClick = async () => {
		if (!selectedVariantId || state === "pending" || state === "added") return;
		setState("pending");
		const result = await addLineToCheckout({ variantId: selectedVariantId, channel });
		if (!result.ok) {
			setState("error");
			setTimeout(() => setState("idle"), 2000);
			return;
		}
		setState("added");
		setTimeout(() => setState("idle"), 2000);
	};

	return (
		<m.button
			type="button"
			disabled={state === "pending" || state === "added"}
			onClick={() => void handleClick()}
			variants={shakeVariants}
			animate={state === "error" ? "shake" : "idle"}
			transition={state === "error" ? { duration: 0.4 } : { duration: 0 }}
			className={clsx(
				"flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-80",
				state === "added"
					? "bg-status-success text-content-inverse"
					: state === "error"
						? "bg-status-danger text-content-inverse"
						: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
			)}
		>
			<AnimatePresence mode="wait" initial={false}>
				{state === "pending" ? (
					<m.span
						key="spinner"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.15 }}
						className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					/>
				) : state === "added" ? (
					<m.span
						key="check"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.15 }}
					>
						<Check size={14} aria-hidden="true" />
					</m.span>
				) : (
					<m.span
						key="cart"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.15 }}
					>
						<ShoppingCart size={14} aria-hidden="true" />
					</m.span>
				)}
			</AnimatePresence>
			<AnimatePresence mode="wait" initial={false}>
				{state === "added" ? (
					<m.span
						key="added-text"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.15 }}
					>
						{t("added")}
					</m.span>
				) : (
					<m.span
						key="add-text"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.15 }}
					>
						{t("addToCart")}
					</m.span>
				)}
			</AnimatePresence>
		</m.button>
	);
}
