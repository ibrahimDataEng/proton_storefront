import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
	MenuGetBySlugDocument,
	OrderDirection,
	ProductListPaginatedDocument,
	ProductOrderField,
	StockAvailability,
	type ProductFilterInput,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Pagination } from "@/ui/components/Pagination";
import { ProductList } from "@/ui/components/ProductList";
import { FilterBar } from "@/ui/components/products/FilterBar";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { CategorySidebarWrapper } from "@/ui/components/CategorySidebarWrapper";
import { Breadcrumb } from "@/ui/components/products/Breadcrumb";
import { ProductsPerPage } from "@/app/[locale]/config";

export const metadata = {
	title: "Products · Saleor Storefront",
	description: "All products in the storefront",
};

type SortParam = "DATE" | "PRICE_ASC" | "PRICE_DESC" | "BEST_SELLING" | "BIGGEST_SAVING";

function getSortConfig(sortParam: string): {
	field: ProductOrderField;
	direction: OrderDirection;
} {
	switch (sortParam) {
		case "PRICE_ASC":
			return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Asc };
		case "PRICE_DESC":
			return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Desc };
		case "BEST_SELLING":
			return { field: ProductOrderField.Rating, direction: OrderDirection.Desc };
		case "BIGGEST_SAVING":
		case "DATE":
		default:
			return { field: ProductOrderField.LastModifiedAt, direction: OrderDirection.Desc };
	}
}

export default async function Page(props: {
	params: Promise<{ channel: string; locale: string }>;
	searchParams: Promise<{
		cursor?: string | string[];
		sortBy?: string;
		minPrice?: string;
		maxPrice?: string;
		inStock?: string;
		category?: string;
		country?: string;
	}>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const { channel, locale } = params;
	const language = getSaleorLanguage(locale);
	const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;
	const sortParam = (searchParams.sortBy ?? "DATE") as SortParam;
	const sortConfig = getSortConfig(sortParam);

	// Fetch nav categories (for filter bar + category ID lookup)
	const menuData = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel, language },
		revalidate: 60,
	});
	const categories = (menuData.menu?.items ?? [])
		.filter(
			(item): item is typeof item & { category: NonNullable<typeof item.category> } =>
				item.category !== null && item.category !== undefined,
		)
		.map((item) => ({
			id: item.category.id,
			slug: item.category.slug,
			name: item.category.translation?.name ?? item.category.name,
		}));

	// Build GraphQL filter
	const filter: ProductFilterInput = {};
	const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
	const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
	if (minPrice !== undefined || maxPrice !== undefined) {
		filter.price = { gte: minPrice, lte: maxPrice };
	}
	if (searchParams.inStock === "true") {
		filter.stockAvailability = StockAvailability.InStock;
	}
	if (searchParams.category) {
		const cat = categories.find((c) => c.slug === searchParams.category);
		if (cat) {
			filter.categories = [cat.id];
		}
	}
	const country = typeof searchParams.country === "string" ? searchParams.country : undefined;
	if (country) {
		filter.attributes = [{ slug: "origin-of-country", values: [country] }];
	}
	const hasFilter = Object.keys(filter).length > 0;

	const { products } = await executeGraphQL(ProductListPaginatedDocument, {
		variables: {
			first: ProductsPerPage,
			after: cursor,
			channel,
			language,
			sortBy: sortConfig.field,
			sortDirection: sortConfig.direction,
			filter: hasFilter ? filter : undefined,
		},
		revalidate: 1,
	});

	if (!products) {
		notFound();
	}

	// Client-side sort for BIGGEST_SAVING (Saleor has no native support)
	let productNodes = products.edges.map((e) => e.node);
	if (sortParam === "BIGGEST_SAVING") {
		productNodes = [...productNodes].sort((a, b) => {
			const aDiscount = a.pricing?.discount?.gross?.amount ?? 0;
			const bDiscount = b.pricing?.discount?.gross?.amount ?? 0;
			return bDiscount - aDiscount;
		});
	}

	// Preserve active filters in pagination URLs
	const paginationParams = new URLSearchParams({
		...(products.pageInfo.endCursor ? { cursor: products.pageInfo.endCursor } : {}),
		...(searchParams.sortBy ? { sortBy: searchParams.sortBy } : {}),
		...(searchParams.minPrice ? { minPrice: searchParams.minPrice } : {}),
		...(searchParams.maxPrice ? { maxPrice: searchParams.maxPrice } : {}),
		...(searchParams.inStock ? { inStock: searchParams.inStock } : {}),
		...(searchParams.category ? { category: searchParams.category } : {}),
		...(country ? { country } : {}),
	});

	const t = await getTranslations("products");
	const activeCategory = typeof searchParams.category === "string" ? searchParams.category : undefined;

	return (
		<div className="mx-auto flex max-w-7xl">
			<CategorySidebarWrapper locale={locale} activeSlug={activeCategory} />
			<section className="mr-16 min-w-0 flex-1 p-8 pb-16 md:mr-0">
				<Breadcrumb categorySlug={activeCategory ?? null} locale={locale} channel={channel} />
				<h1 className="mb-6 text-2xl font-semibold text-content-primary">{t("title")}</h1>
				<FilterBar
					totalCount={products.totalCount ?? productNodes.length}
					categories={categories}
					activeCountry={country}
				/>
				{productNodes.length === 0 ? (
					<div className="flex flex-col items-center gap-4 py-16 text-center">
						<p className="text-content-secondary">{t("noResults")}</p>
						<LinkWithChannel
							href="/products"
							className="inline-flex items-center rounded-lg border border-line-subtle px-4 py-2 text-sm text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
						>
							{t("clearAndReset")}
						</LinkWithChannel>
					</div>
				) : (
					<>
						<ProductList products={productNodes} />
						<Pagination
							pageInfo={{
								...products.pageInfo,
								basePathname: `/products`,
								urlSearchParams: paginationParams,
							}}
						/>
					</>
				)}
			</section>
		</div>
	);
}
