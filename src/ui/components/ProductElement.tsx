import { getTranslations } from "next-intl/server";
import { clsx } from "clsx";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import { ProductAddButton } from "@/ui/components/products/ProductAddButton";
import type { ProductListItemFragment } from "@/gql/graphql";
import { formatMoneyRange } from "@/lib/utils";

export async function ProductElement({
	product,
	loading,
	priority,
}: { product: ProductListItemFragment } & { loading: "eager" | "lazy"; priority?: boolean }) {
	const t = await getTranslations("products");

	const variants = product.variants ?? [];
	const singleVariant = variants.length === 1 ? variants[0] : undefined;
	const showPills = variants.length > 1;
	const extraCount = variants.length > 4 ? variants.length - 3 : 0;
	const displayPills = extraCount > 0 ? variants.slice(0, 3) : variants.slice(0, 4);
	const isAvailable = product.isAvailable ?? true;

	return (
		<li data-testid="ProductElement">
			<div className="group flex flex-col gap-3">
				<LinkWithChannel href={`/products/${product.slug}`} key={product.id}>
					<div>
						<div className="relative overflow-hidden rounded-lg">
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
									sizes={"512px"}
									priority={priority}
								/>
							)}
						</div>
						<div className="mt-2 flex justify-between">
							<div>
								<h3 className="mt-1 text-sm font-semibold text-content-primary">
									{product.translation?.name || product.name}
								</h3>
								<p className="mt-1 text-sm text-content-secondary" data-testid="ProductElement_Category">
									{product.category?.translation?.name || product.category?.name}
								</p>
							</div>
							<p
								className="mt-1 text-sm font-medium text-content-primary"
								data-testid="ProductElement_PriceRange"
							>
								{formatMoneyRange({
									start: product?.pricing?.priceRange?.start?.gross,
									stop: product?.pricing?.priceRange?.stop?.gross,
								})}
							</p>
						</div>
					</div>
				</LinkWithChannel>

				{showPills && (
					<div className="flex flex-wrap gap-1">
						{displayPills.map((v, i) => (
							<span
								key={v.id}
								className={clsx(
									"rounded-full px-2 py-0.5 text-xs",
									i === 0
										? "bg-brand-primary text-content-inverse"
										: "bg-surface-sunken text-content-secondary",
								)}
							>
								{v.name}
							</span>
						))}
						{extraCount > 0 && (
							<span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-content-secondary">
								+{extraCount} more
							</span>
						)}
					</div>
				)}

				<ProductAddButton
					variantId={singleVariant?.id}
					productSlug={product.slug}
					isAvailable={isAvailable}
				/>
			</div>
		</li>
	);
}
