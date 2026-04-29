import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { executeGraphQL } from "@/lib/graphql";
import { ProductListByCategoryDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { ProductElement } from "@/ui/components/ProductElement";

interface Props {
	categorySlug: string;
	currentSlug: string;
	locale: string;
	channel: string;
}

async function RelatedProductsList({ categorySlug, currentSlug, locale, channel }: Props) {
	const t = await getTranslations({ locale, namespace: "products" });
	const language = getSaleorLanguage(locale) as LanguageCodeEnum;

	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: categorySlug, channel, language },
		revalidate: 60,
	});

	const products = (category?.products?.edges ?? [])
		.map((e) => e.node)
		.filter((p) => p.slug !== currentSlug)
		.slice(0, 4);

	if (products.length === 0) return null;

	return (
		<section className="mt-16">
			<h2 className="mb-6 text-xl font-bold text-content-primary">{t("relatedProducts")}</h2>
			<ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{products.map((product, i) => (
					<ProductElement
						key={product.id}
						product={product}
						loading={i === 0 ? "eager" : "lazy"}
						priority={i === 0}
					/>
				))}
			</ul>
		</section>
	);
}

function RelatedProductsSkeleton() {
	return (
		<section className="mt-16">
			<div className="mb-6 h-7 w-48 animate-pulse rounded-lg bg-surface-sunken" />
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-sunken" />
				))}
			</div>
		</section>
	);
}

export function RelatedProducts(props: Props) {
	return (
		<Suspense fallback={<RelatedProductsSkeleton />}>
			<RelatedProductsList {...props} />
		</Suspense>
	);
}
