import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { type WithContext, type Product } from "schema-dts";
import { executeGraphQL } from "@/lib/graphql";
import { LanguageCodeEnum, ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
import { Container } from "@/ui/components/Container";
import { ProductGallery } from "@/ui/components/pdp/ProductGallery";
import { ProductInfo } from "@/ui/components/pdp/ProductInfo";
import { RelatedProducts } from "@/ui/components/pdp/RelatedProducts";

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string; locale: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await props.params;
	const { locale, channel, slug } = params;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: { slug: decodeURIComponent(slug), channel, language },
		revalidate: 1,
	});

	if (!product) notFound();

	const localizedProduct = locale === "ar" && product.translation ? product.translation : product;
	const productName = localizedProduct.seoTitle || localizedProduct.name || product.name;

	return {
		title: `${localizedProduct.name ?? product.name} | ${
			localizedProduct.seoTitle || (await parent).title?.absolute
		}`,
		description: localizedProduct.seoDescription || productName,
		alternates: {
			canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
				? `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/products/${encodeURIComponent(slug)}`
				: undefined,
		},
		openGraph: product.thumbnail ? { images: [{ url: product.thumbnail.url, alt: product.name }] } : null,
	};
}

export async function generateStaticParams({ params }: { params: { channel: string; locale: string } }) {
	const { channel, locale } = params;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const { products } = await executeGraphQL(ProductListDocument, {
		revalidate: 1,
		variables: { first: 20, channel, language },
		withAuth: false,
	});
	return products?.edges.map(({ node: { slug } }) => ({ slug })) ?? [];
}

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const params = await props.params;
	const { locale, channel, slug } = params;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: { slug: decodeURIComponent(slug), channel, language },
		revalidate: 1,
	});

	if (!product) notFound();

	const localizedProduct = locale === "ar" && product.translation ? product.translation : product;

	// Build gallery images: media first, fall back to thumbnail
	const galleryImages: Array<{ url: string; alt: string | null }> =
		product.media && product.media.length > 0
			? product.media.map((m) => ({ url: m.url, alt: m.alt }))
			: product.thumbnail
				? [{ url: product.thumbnail.url, alt: product.thumbnail.alt ?? null }]
				: [];

	// JSON-LD structured data
	const variants = product.variants ?? [];
	const hasVariants = variants.length > 0;
	const productJsonLd: WithContext<Product> = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: localizedProduct.name ?? product.name ?? "",
		description: localizedProduct.seoDescription || product.seoDescription || "",
		image: product.thumbnail?.url,
		offers: hasVariants
			? {
					"@type": "AggregateOffer",
					availability: variants.some((v) => v.quantityAvailable)
						? "https://schema.org/InStock"
						: "https://schema.org/OutOfStock",
					priceCurrency: product.pricing?.priceRange?.start?.gross.currency,
					lowPrice: product.pricing?.priceRange?.start?.gross.amount,
					highPrice: product.pricing?.priceRange?.stop?.gross.amount,
				}
			: undefined,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
			/>
			<Container className="py-8 md:py-12">
				<div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
					<ProductGallery images={galleryImages} productName={product.name} />
					<ProductInfo product={product} locale={locale} channel={channel} />
				</div>

				{product.category?.slug && (
					<RelatedProducts
						categorySlug={product.category.slug}
						currentSlug={slug}
						locale={locale}
						channel={channel}
					/>
				)}
			</Container>
		</>
	);
}
