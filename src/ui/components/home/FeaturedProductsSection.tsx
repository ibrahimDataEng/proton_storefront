import { LanguageCodeEnum, ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Container } from "@/ui/components/Container";
import { ProductList } from "@/ui/components/ProductList";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

function getLanguage(locale: string): LanguageCodeEnum {
	return locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
}

export async function FeaturedProductsSection({ channel, locale }: { channel: string; locale: string }) {
	const isAr = locale === "ar";

	const data = await executeGraphQL(ProductListByCollectionDocument, {
		variables: {
			slug: "featured-products",
			channel,
			language: getLanguage(locale),
		},
		// Revalidate every 60 seconds — was 1 (effectively SSR)
		revalidate: 60,
	});

	const products = data.collection?.products?.edges?.map(({ node }) => node);

	if (!products || products.length === 0) {
		return null;
	}

	return (
		<section className="bg-surface-base py-20 md:py-28">
			<Container>
				{/* Section header */}
				<div className="mb-16 text-center">
					<p className="mb-3 text-sm uppercase tracking-widest text-brand-accent">
						{isAr ? "المميز" : "Featured"}
					</p>
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">
						{isAr ? "مختار خصيصاً لك" : "Handpicked For You"}
					</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				<ProductList products={products} />

				{/* View All link */}
				<div className="mt-12 text-center">
					<LinkWithChannel
						href="/products"
						className="inline-flex h-11 items-center justify-center rounded-md border border-line-default px-5 text-base font-medium text-content-primary transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
					>
						{isAr ? "عرض جميع المنتجات" : "View All Products"}
					</LinkWithChannel>
				</div>
			</Container>
		</section>
	);
}
