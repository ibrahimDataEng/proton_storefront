"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { addLineToCheckout } from "@/app/[locale]/[channel]/(main)/cart/actions";

interface Props {
	variantId?: string;
	productSlug: string;
	isAvailable: boolean;
}

export function ProductAddButton({ variantId, productSlug, isAvailable }: Props) {
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

	if (!variantId) {
		return (
			<LinkWithChannel
				href={`/products/${productSlug}`}
				className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
			>
				<ShoppingCart size={14} aria-hidden="true" />
				{t("selectVariant")}
			</LinkWithChannel>
		);
	}

	const handleClick = async () => {
		if (state === "pending" || state === "added") return;
		setState("pending");
		const result = await addLineToCheckout({ variantId, channel });
		if (!result.ok) {
			setState("error");
			setTimeout(() => setState("idle"), 2000);
			return;
		}
		setState("added");
		setTimeout(() => setState("idle"), 2000);
	};

	return (
		<button
			type="button"
			disabled={state === "pending" || state === "added"}
			onClick={() => void handleClick()}
			className={clsx(
				"flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-80",
				state === "added"
					? "bg-status-success text-content-inverse"
					: state === "error"
						? "bg-status-danger text-content-inverse"
						: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
			)}
		>
			{state === "pending" ? (
				<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
			) : (
				<ShoppingCart size={14} aria-hidden="true" />
			)}
			{state === "added" ? t("added") : state === "error" ? t("addToCart") : t("addToCart")}
		</button>
	);
}
