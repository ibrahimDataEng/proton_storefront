"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { clsx } from "clsx";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import { ProductAddButton } from "@/ui/components/products/ProductAddButton";
import type { ProductListItemFragment } from "@/gql/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";

export function ProductElement({
	product,
	loading,
	priority,
}: { product: ProductListItemFragment } & { loading: "eager" | "lazy"; priority?: boolean }) {
	const t = useTranslations("products");
	const variants = product.variants ?? [];
	const isAvailable = product.isAvailable ?? true;

	const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(variants[0]?.id);

	const pillsRef = useRef<HTMLDivElement>(null);

	const selectedVariant = variants.find((v) => v.id === selectedVariantId);

	// Compute display price and optional struck-through original price
	let displayPrice: string | null = null;
	let originalPrice: string | null = null;

	if (selectedVariant?.pricing?.price?.gross) {
		const p = selectedVariant.pricing.price.gross;
		displayPrice = formatMoney(p.amount, p.currency);
		const u = selectedVariant.pricing.priceUndiscounted?.gross;
		if (u && u.amount > p.amount) {
			originalPrice = formatMoney(u.amount, u.currency);
		}
	} else {
		displayPrice =
			formatMoneyRange({
				start: product.pricing?.priceRange?.start?.gross,
				stop: product.pricing?.priceRange?.stop?.gross,
			}) || null;
	}

	const showVariantPills = variants.length > 1;

	const handlePillsScroll = () => {
		pillsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		// Focus the first pill for accessibility
		const firstPill = pillsRef.current?.querySelector("button");
		firstPill?.focus();
	};

	return (
		<m.li
			data-testid="ProductElement"
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-50px" }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-base shadow-sm transition-shadow duration-200 hover:shadow-md"
		>
			<div className="flex flex-col gap-3 p-3">
				{/* Image + name — linked to product page */}
				<LinkWithChannel href={`/products/${product.slug}`} key={product.id}>
					<div className="relative overflow-hidden rounded-xl">
						{!isAvailable && (
							<div className="absolute right-2 top-2 z-10 rounded-md bg-surface-raised px-2 py-0.5 text-xs text-status-danger shadow-soft">
								{t("outOfStock")}
							</div>
						)}
						{product?.thumbnail?.url && (
							<ProductImageWrapper
								loading={loading}
								src={product.thumbnail.url}
								alt={product.thumbnail.alt ?? ""}
								width={512}
								height={512}
								sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
								priority={priority}
							/>
						)}
					</div>
					<h3 className="mt-3 line-clamp-2 text-sm font-semibold text-content-primary">
						{product.translation?.name || product.name}
					</h3>
				</LinkWithChannel>

				{/* Variant pills — interactive, all shown */}
				{showVariantPills && (
					<div ref={pillsRef} className="flex flex-wrap gap-1.5">
						{variants.map((v) => (
							<m.button
								key={v.id}
								whileTap={{ scale: 0.95 }}
								type="button"
								onClick={() => setSelectedVariantId(v.id)}
								className={clsx(
									"rounded-full px-3 py-1 text-xs transition-colors",
									v.id === selectedVariantId
										? "bg-brand-primary font-medium text-content-inverse"
										: "bg-surface-sunken text-content-secondary hover:bg-surface-raised",
								)}
							>
								{v.name}
							</m.button>
						))}
					</div>
				)}

				{/* Price */}
				<div className="flex flex-col">
					{originalPrice && (
						<span className="text-xs text-content-secondary line-through">{originalPrice}</span>
					)}
					<p className="text-base font-semibold text-content-primary" data-testid="ProductElement_PriceRange">
						{displayPrice}
					</p>
				</div>

				{/* Add to cart */}
				<ProductAddButton
					selectedVariantId={selectedVariantId}
					productSlug={product.slug}
					isAvailable={isAvailable}
					hasMultipleVariants={showVariantPills}
					onSelectClick={handlePillsScroll}
				/>
			</div>
		</m.li>
	);
}
