"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { SaveForLaterButton } from "./SaveForLaterButton";
import type { SavedItem } from "./SavedForLater";
import type { CheckoutFindQuery } from "@/gql/graphql";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { DeleteLineButton } from "@/app/[locale]/[channel]/(main)/cart/DeleteLineButton";
import { updateLineQuantity } from "@/app/[locale]/[channel]/(main)/cart/actions";

type CheckoutLine = NonNullable<CheckoutFindQuery["checkout"]>["lines"][number];

interface CartLineItemProps {
	line: CheckoutLine;
	checkoutId: string;
}

export function CartLineItem({ line, checkoutId }: CartLineItemProps) {
	const t = useTranslations("cart");
	const [isLeaving, setIsLeaving] = useState(false);
	const [quantity, setQuantity] = useState(line.quantity);
	const [isPendingQty, setIsPendingQty] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const committedQtyRef = useRef(line.quantity);

	const { variant } = line;
	const product = variant.product;
	const productName = product.translation?.name || product.name;
	const categoryName = product.category?.translation?.name || product.category?.name;
	const unitPrice = variant.pricing?.price?.gross;

	const savedItem: SavedItem = {
		id: line.id,
		variantId: variant.id,
		productSlug: product.slug,
		productName,
		categoryName: categoryName ?? "",
		thumbnailUrl: product.thumbnail?.url ?? "",
		thumbnailAlt: product.thumbnail?.alt ?? "",
		unitPrice: unitPrice ? { amount: unitPrice.amount, currency: unitPrice.currency } : null,
		quantity: line.quantity,
	};

	const handleQtyChange = (delta: number) => {
		const next = Math.max(1, Math.min(99, quantity + delta));
		if (next === quantity) return;
		setQuantity(next);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		setIsPendingQty(true);
		debounceRef.current = setTimeout(() => {
			void updateLineQuantity({ lineId: line.id, checkoutId, quantity: next })
				.then((result) => {
					if (result.ok) {
						committedQtyRef.current = next;
					} else {
						setQuantity(committedQtyRef.current);
					}
				})
				.catch(() => {
					// Network failure / Saleor down — revert to the last confirmed quantity.
					setQuantity(committedQtyRef.current);
				})
				.finally(() => setIsPendingQty(false));
		}, 500);
	};

	return (
		<div
			className={clsx(
				"overflow-hidden transition-all duration-300",
				isLeaving ? "max-h-0 scale-95 opacity-0" : "max-h-[500px] scale-100 opacity-100",
			)}
		>
			<div className="flex gap-4 rounded-xl border border-line-subtle bg-surface-raised p-4 shadow-soft sm:gap-6 sm:p-5">
				{/* Thumbnail */}
				<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-sunken sm:h-28 sm:w-28">
					{product.thumbnail?.url ? (
						<Image
							src={product.thumbnail.url}
							alt={product.thumbnail.alt ?? ""}
							width={200}
							height={200}
							className="h-full w-full object-contain"
						/>
					) : (
						<div className="h-full w-full" />
					)}
				</div>

				{/* Details */}
				<div className="flex flex-1 flex-col justify-between gap-2">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1">
							<LinkWithChannel
								href={getHrefForVariant({ productSlug: product.slug, variantId: variant.id })}
								className="font-semibold text-content-primary transition-colors hover:text-brand-primary"
							>
								{productName}
							</LinkWithChannel>
							{categoryName && <p className="mt-0.5 text-sm text-content-secondary">{categoryName}</p>}
							{variant.name !== variant.id && Boolean(variant.name) && (
								<p className="mt-0.5 text-sm text-content-secondary">{variant.name}</p>
							)}
							{unitPrice && (
								<p className="mt-1 text-sm text-content-secondary">
									{formatMoney(unitPrice.amount, unitPrice.currency)}
								</p>
							)}
						</div>
						<p className="whitespace-nowrap text-lg font-semibold text-content-primary">
							{formatMoney(line.totalPrice.gross.amount, line.totalPrice.gross.currency)}
						</p>
					</div>

					<div className="flex items-center justify-between">
						{/* Quantity stepper */}
						<div
							className={clsx(
								"inline-flex items-center rounded-full bg-surface-sunken transition-opacity",
								isPendingQty && "opacity-50",
							)}
						>
							<button
								type="button"
								aria-label={t("decrease")}
								disabled={quantity <= 1 || isPendingQty}
								className="flex h-8 w-8 items-center justify-center rounded-l-full text-content-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:text-content-secondary"
								onClick={() => handleQtyChange(-1)}
							>
								−
							</button>
							<span className="min-w-[2rem] text-center text-sm font-medium text-content-primary">
								{quantity}
							</span>
							<button
								type="button"
								aria-label={t("increase")}
								disabled={quantity >= 99 || isPendingQty}
								className="flex h-8 w-8 items-center justify-center rounded-r-full text-content-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:text-content-secondary"
								onClick={() => handleQtyChange(1)}
							>
								+
							</button>
						</div>

						<div className="flex items-center gap-2">
							<SaveForLaterButton
								lineId={line.id}
								checkoutId={checkoutId}
								item={savedItem}
								label={t("saveForLater")}
								alreadySavedLabel={t("alreadySaved")}
								onLeave={() => setIsLeaving(true)}
								onLeaveCancelled={() => setIsLeaving(false)}
							/>
							<DeleteLineButton checkoutId={checkoutId} lineId={line.id} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
