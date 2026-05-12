"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { ChevronRight, ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { clsx } from "clsx";
import xss from "xss";
import edjsHTML from "editorjs-html";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { AvailabilityMessage } from "@/ui/components/AvailabilityMessage";
import { addLineWithQuantity } from "@/app/[locale]/[channel]/(main)/cart/actions";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import type { ProductDetailsQuery } from "@/gql/graphql";

type Product = NonNullable<ProductDetailsQuery["product"]>;

interface Props {
	product: Product;
	locale: string;
	channel: string;
}

const parser = edjsHTML();

const shakeVariants = {
	idle: { x: 0 },
	shake: { x: [-8, 8, -8, 8, 0] },
};

export function ProductInfo({ product, locale, channel }: Props) {
	const t = useTranslations("products");
	const tCart = useTranslations("cart");

	const variants = product.variants ?? [];
	const firstAvailable = variants.find((v) => (v.quantityAvailable ?? 0) > 0) ?? variants[0];
	const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(firstAvailable?.id);
	const [quantity, setQuantity] = useState(1);
	const [addStatus, setAddStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
	const [descExpanded, setDescExpanded] = useState(false);

	const selectedVariant = variants.find((v) => v.id === selectedVariantId);
	const maxQty = Math.min(99, selectedVariant?.quantityAvailable ?? 99);
	const isAvailable =
		selectedVariant != null
			? (selectedVariant.quantityAvailable ?? 0) > 0
			: variants.some((v) => (v.quantityAvailable ?? 0) > 0);

	// Price display
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

	// Localized content
	const localizedProduct = locale === "ar" && product.translation ? product.translation : product;
	const productName = localizedProduct.name ?? product.name;
	const categoryName =
		locale === "ar" && product.category?.translation?.name
			? product.category.translation.name
			: product.category?.name;

	// Description
	let descriptionHtml: string[] | null = null;
	const rawDesc = localizedProduct.description;
	if (rawDesc) {
		try {
			descriptionHtml = parser.parse(JSON.parse(rawDesc));
		} catch {
			descriptionHtml = null;
		}
	}

	const handleVariantChange = (id: string) => {
		setSelectedVariantId(id);
		setQuantity(1);
	};

	const handleAddToCart = async () => {
		if (!selectedVariantId || addStatus === "pending" || addStatus === "success") return;
		setAddStatus("pending");
		const result = await addLineWithQuantity({ variantId: selectedVariantId, channel, quantity });
		if (!result.ok) {
			setAddStatus("error");
			setTimeout(() => setAddStatus("idle"), 2000);
			return;
		}
		setAddStatus("success");
		setTimeout(() => setAddStatus("idle"), 2000);
	};

	return (
		<div className="flex flex-col gap-5">
			{/* Breadcrumb */}
			{product.category && (
				<nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-content-secondary">
					<LinkWithChannel
						href={`/categories/${product.category.slug}`}
						className="transition-colors hover:text-content-primary"
					>
						{categoryName}
					</LinkWithChannel>
					<ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
					<span className="line-clamp-1 text-content-primary">{productName}</span>
				</nav>
			)}

			{/* Product name */}
			<h1 className="text-2xl font-bold text-content-primary md:text-3xl">{productName}</h1>

			{/* Price */}
			<div className="flex flex-col gap-0.5">
				{originalPrice && (
					<span className="text-sm text-content-secondary line-through">{originalPrice}</span>
				)}
				{displayPrice && <span className="text-2xl font-bold text-brand-primary">{displayPrice}</span>}
			</div>

			{/* Variant selector */}
			{variants.length > 1 && (
				<ProductVariantSelector
					variants={variants}
					selectedVariantId={selectedVariantId}
					onVariantChange={handleVariantChange}
				/>
			)}

			{/* Quantity stepper */}
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium text-content-secondary">{t("quantity")}</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label={tCart("decrease")}
						disabled={quantity <= 1 || !selectedVariantId}
						onClick={() => setQuantity((q) => Math.max(1, q - 1))}
						className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-subtle bg-surface-base text-content-primary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Minus className="h-4 w-4" aria-hidden="true" />
					</button>
					<span
						className="w-10 text-center text-sm font-semibold text-content-primary"
						aria-live="polite"
						aria-atomic="true"
					>
						{quantity}
					</span>
					<button
						type="button"
						aria-label={tCart("increase")}
						disabled={quantity >= maxQty || !selectedVariantId}
						onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
						className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-subtle bg-surface-base text-content-primary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Plus className="h-4 w-4" aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Availability */}
			<AvailabilityMessage isAvailable={isAvailable} />

			{/* Add to cart button */}
			{!selectedVariantId ? (
				<button
					type="button"
					disabled
					className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-primary px-6 py-3.5 text-base font-semibold text-brand-primary opacity-70"
				>
					{t("selectVariant")}
				</button>
			) : (
				<m.button
					type="button"
					disabled={addStatus === "pending" || addStatus === "success" || !isAvailable}
					onClick={() => void handleAddToCart()}
					variants={shakeVariants}
					animate={addStatus === "error" ? "shake" : "idle"}
					transition={addStatus === "error" ? { duration: 0.4 } : { duration: 0 }}
					className={clsx(
						"flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-colors disabled:opacity-80",
						addStatus === "success"
							? "bg-status-success text-content-inverse"
							: addStatus === "error"
								? "bg-status-danger text-content-inverse"
								: !isAvailable
									? "cursor-not-allowed bg-surface-sunken text-content-secondary"
									: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
					)}
				>
					<AnimatePresence mode="wait" initial={false}>
						{addStatus === "pending" ? (
							<m.span
								key="spinner"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.15 }}
								className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
							/>
						) : addStatus === "success" ? (
							<m.span
								key="check"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.15 }}
							>
								<Check className="h-5 w-5" aria-hidden="true" />
							</m.span>
						) : (
							<m.span
								key="cart"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ duration: 0.15 }}
							>
								<ShoppingCart className="h-5 w-5" aria-hidden="true" />
							</m.span>
						)}
					</AnimatePresence>
					<AnimatePresence mode="wait" initial={false}>
						{addStatus === "success" ? (
							<m.span
								key="added-text"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15 }}
							>
								{t("added")}
							</m.span>
						) : addStatus === "error" ? (
							<m.span
								key="error-text"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15 }}
							>
								{t("addError")}
							</m.span>
						) : !isAvailable ? (
							<m.span
								key="oos-text"
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.15 }}
							>
								{t("outOfStock")}
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
			)}

			{/* Attributes / Specifications */}
			{product.attributes.length > 0 && (
				<div className="rounded-xl bg-surface-raised p-4">
					<h2 className="mb-3 text-sm font-semibold text-content-primary">{t("specifications")}</h2>
					<dl className="flex flex-col gap-2">
						{product.attributes.map((attr, i) => {
							const attrName =
								locale === "ar" && attr.attribute.translation?.name
									? attr.attribute.translation.name
									: attr.attribute.name;
							const values = attr.values
								.map((v) => (locale === "ar" && v.translation?.name ? v.translation.name : v.name ?? ""))
								.filter(Boolean)
								.join(", ");
							if (!values) return null;
							return (
								<div key={i} className="flex items-start gap-2 text-sm">
									<dt className="w-32 flex-shrink-0 text-content-secondary">{attrName}</dt>
									<dd className="text-content-primary">{values}</dd>
								</div>
							);
						})}
					</dl>
				</div>
			)}

			{/* Description */}
			{descriptionHtml && descriptionHtml.length > 0 && (
				<div className="flex flex-col gap-2">
					<div
						className={clsx(
							"overflow-hidden text-sm leading-relaxed text-content-secondary transition-all",
							!descExpanded && "line-clamp-3",
						)}
					>
						{descriptionHtml.map((content, i) => (
							<div key={i} dangerouslySetInnerHTML={{ __html: xss(content) }} />
						))}
					</div>
					{descriptionHtml.length > 0 && (
						<button
							type="button"
							onClick={() => setDescExpanded((v) => !v)}
							className="self-start text-sm font-medium text-brand-primary hover:underline"
						>
							{descExpanded ? t("readLess") : t("readMore")}
						</button>
					)}
				</div>
			)}
		</div>
	);
}
