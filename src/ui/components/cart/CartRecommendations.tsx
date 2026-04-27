import { getTranslations } from "next-intl/server";
import {
	ProductListByCategoryDocument,
	MenuGetBySlugDocument,
	type ProductListItemFragment,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { ProductElement } from "@/ui/components/ProductElement";
import { AddToCartButton } from "@/ui/components/cart/AddToCartButton";
import { Container } from "@/ui/components/Container";

interface CartRecommendationsProps {
	channel: string;
	locale: string;
	categorySlugs: string[];
	excludeProductIds: string[];
}

const MAX_RECOMMENDATIONS = 8;

export async function CartRecommendations({
	channel,
	locale,
	categorySlugs,
	excludeProductIds,
}: CartRecommendationsProps) {
	const t = await getTranslations("cart");
	const language = getSaleorLanguage(locale);

	let slugs = categorySlugs;

	// Fallback: use first category from the nav menu when cart has no category links
	if (slugs.length === 0) {
		const menuData = await executeGraphQL(MenuGetBySlugDocument, {
			variables: { slug: "navbar", channel, language },
			revalidate: 60,
		});
		const firstCategory = menuData.menu?.items?.find((item) => item.category)?.category;
		if (firstCategory) {
			slugs = [firstCategory.slug];
		}
	}

	if (slugs.length === 0) return null;

	const categoryResults = await Promise.all(
		slugs.map((slug) =>
			executeGraphQL(ProductListByCategoryDocument, {
				variables: { slug, channel, language },
				revalidate: 60,
			}).then((data) => data.category?.products?.edges.map((e) => e.node) ?? []),
		),
	);

	// Round-robin interleave, excluding items already in the cart
	const excluded = new Set(excludeProductIds);
	const recommendations: ProductListItemFragment[] = [];
	const maxLen = Math.max(...categoryResults.map((r) => r.length));

	outer: for (let i = 0; i < maxLen; i++) {
		for (const results of categoryResults) {
			if (recommendations.length >= MAX_RECOMMENDATIONS) break outer;
			const product = results[i];
			if (product && !excluded.has(product.id)) {
				recommendations.push(product);
				excluded.add(product.id);
			}
		}
	}

	if (recommendations.length === 0) return null;

	return (
		<section className="mt-16">
			<Container>
				<h2 className="mb-8 text-xl font-semibold text-content-primary">{t("youMightAlsoLike")}</h2>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6" role="list">
					{recommendations.map((product, index) => (
						<div key={product.id} className="flex flex-col gap-2">
							<ProductElement product={product} loading={index < 4 ? "eager" : "lazy"} />
							<AddToCartButton productSlug={product.slug} label={t("addToCart")} />
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}

export function CartRecommendationsSkeleton() {
	return (
		<section className="mt-16">
			<Container>
				<div className="mb-8 h-7 w-48 animate-pulse rounded-md bg-surface-sunken" />
				<ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6" role="list">
					{Array.from({ length: 4 }).map((_, i) => (
						<li key={i} className="flex flex-col gap-3">
							<div className="aspect-square animate-pulse rounded-lg bg-surface-sunken" />
							<div className="h-4 animate-pulse rounded bg-surface-sunken" />
							<div className="h-3 w-3/4 animate-pulse rounded bg-surface-sunken" />
						</li>
					))}
				</ul>
			</Container>
		</section>
	);
}
