"use client";

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { SaveForLaterButton } from "./SaveForLaterButton";
import type { SavedItem } from "./SavedForLater";
import type { CheckoutFindQuery } from "@/gql/graphql";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { DeleteLineButton } from "@/app/[locale]/[channel]/(main)/cart/DeleteLineButton";

type CheckoutLine = NonNullable<CheckoutFindQuery["checkout"]>["lines"][number];

interface CartLineItemProps {
	line: CheckoutLine;
	checkoutId: string;
}

export function CartLineItem({ line, checkoutId }: CartLineItemProps) {
	const t = useTranslations("cart");
	const [isLeaving, setIsLeaving] = useState(false);

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
						<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1 text-sm text-content-primary">
							<span className="text-content-secondary">{t("qty")}</span>
							{line.quantity}
						</span>
						<div className="flex items-center gap-2">
							<SaveForLaterButton
								lineId={line.id}
								checkoutId={checkoutId}
								item={savedItem}
								label={t("saveForLater")}
								onLeave={() => setIsLeaving(true)}
							/>
							<DeleteLineButton checkoutId={checkoutId} lineId={line.id} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
