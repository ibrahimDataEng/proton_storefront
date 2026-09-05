import { getTranslations } from "next-intl/server";
import { ProductsByIdsDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Container } from "@/ui/components/Container";
import { ProductList } from "@/ui/components/ProductList";

/**
 * Below this many products the section renders nothing at all. The store is newly
 * launched with limited traffic — a sparse "trending" row looks worse than none.
 */
const MIN_PRODUCTS = 4;
const REQUESTED_LIMIT = 8;

interface TrendingResponse {
	products?: { productId?: unknown; score?: unknown }[];
}

async function fetchProducts(ids: string[], channel: string, locale: string) {
	const data = await executeGraphQL(ProductsByIdsDocument, {
		variables: {
			ids,
			channel,
			language: getSaleorLanguage(locale) as LanguageCodeEnum,
			first: ids.length,
		},
		revalidate: 300,
	});
	return data.products?.edges?.map(({ node }) => node) ?? [];
}

/**
 * Reads the ordered trending list from proton_analytics (server-side only — the
 * service has no auth and must never be reachable from the browser), then resolves
 * those ids against Saleor.
 *
 * Any failure — service down, timeout, malformed payload, too few results — renders
 * nothing rather than surfacing an error. Trending is decorative; the homepage must
 * never depend on it.
 */
export async function TrendingSection({ channel, locale }: { channel: string; locale: string }) {
	const analyticsUrl = process.env.ANALYTICS_SERVICE_URL;
	if (!analyticsUrl) return null;

	let productIds: string[] = [];
	try {
		const response = await fetch(`${analyticsUrl}/trending?limit=${REQUESTED_LIMIT}`, {
			signal: AbortSignal.timeout(2000),
			// Matches proton_analytics' own 10-minute aggregation cycle; polling faster
			// would only re-read the same scores.
			next: { revalidate: 300 },
		});
		if (!response.ok) return null;

		const data = (await response.json()) as TrendingResponse;
		productIds = (data.products ?? [])
			.map((entry) => entry?.productId)
			.filter((id): id is string => typeof id === "string" && id !== "");
	} catch {
		// Service unreachable or timed out — render nothing.
		return null;
	}

	if (productIds.length < MIN_PRODUCTS) return null;

	// Saleor rejects the WHOLE query with "Invalid ID specified." if even one id in the
	// array isn't a valid global ID, so a single bad entry from the analytics service
	// must not be allowed to throw — that would bubble past Suspense to the error
	// boundary and take the homepage down over a decorative section.
	let nodes: NonNullable<Awaited<ReturnType<typeof fetchProducts>>>;
	try {
		nodes = await fetchProducts(productIds, channel, locale);
	} catch (error) {
		console.error(
			`[TrendingSection] product lookup failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}

	// Saleor's `filter: { ids }` gives no ordering guarantee, so re-sort into the
	// score order proton_analytics returned — showing the top-scoring product first
	// is the entire point of this section. Ids Saleor didn't return (unpublished,
	// deleted, not in this channel) simply drop out here.
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const products = productIds
		.map((id) => byId.get(id))
		.filter((node): node is (typeof nodes)[number] => !!node);

	// Re-check after resolution: ids can disappear between the two calls.
	if (products.length < MIN_PRODUCTS) return null;

	const t = await getTranslations({ locale, namespace: "home" });

	return (
		<section className="bg-surface-base py-20 md:py-28">
			<Container>
				<div className="mb-16 text-center">
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">{t("trendingNow")}</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				<ProductList products={products} />
			</Container>
		</section>
	);
}

export function TrendingSectionSkeleton() {
	return (
		<section className="bg-surface-base py-20 md:py-28">
			<Container>
				<div className="mb-16 flex flex-col items-center">
					<div className="h-9 w-56 animate-pulse rounded-lg bg-surface-sunken" />
					<div className="mt-4 h-px w-12 bg-brand-accent" />
				</div>
				<ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
					{[0, 1, 2, 3].map((i) => (
						<li key={i} className="aspect-square animate-pulse rounded-2xl bg-surface-sunken" />
					))}
				</ul>
			</Container>
		</section>
	);
}
