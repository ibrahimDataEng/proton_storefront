import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import { AddButton } from "./AddButton";
import { VariantSelector } from "@/ui/components/VariantSelector";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import {
	CheckoutAddLineDocument,
	LanguageCodeEnum,
	ProductDetailsDocument,
	ProductListDocument,
} from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";
import { AvailabilityMessage } from "@/ui/components/AvailabilityMessage";

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string; locale: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const locale = (await props.params).locale;
	console.log("jjj", locale);

	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			language: language,
		},
		//revalidate: 60,
		revalidate: 1,
	});

	if (!product) {
		notFound();
	}
	const localizedProduct = locale === "ar" && product?.translation ? product.translation : product;
	const productName = localizedProduct.seoTitle || localizedProduct.name;
	const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
	const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;

	return {
		title: `${localizedProduct.name} | ${localizedProduct.seoTitle || (await parent).title?.absolute}`,
		description: localizedProduct.seoDescription || productNameAndVariant,
		alternates: {
			canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
				? process.env.NEXT_PUBLIC_STOREFRONT_URL + `/products/${encodeURIComponent(params.slug)}`
				: undefined,
		},
		openGraph: product.thumbnail
			? {
					images: [
						{
							url: product.thumbnail.url,
							alt: product.name,
						},
					],
				}
			: null,
	};
}

export async function generateStaticParams({ params }: { params: { channel: string; locale: string } }) {
	const locale = params.locale;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const { products } = await executeGraphQL(ProductListDocument, {
		//revalidate: 60,
		revalidate: 1,
		variables: { first: 20, channel: params.channel, language: language },
		withAuth: false,
	});

	const paths = products?.edges.map(({ node: { slug } }) => ({ slug })) || [];
	return paths;
}

const parser = edjsHTML();

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const locale = (await props.params).locale;
	console.log("jjj", locale);

	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			language: language,
		},
		//revalidate: 60,
		revalidate: 1,
	});

	if (!product) {
		notFound();
	}

	const localizedProduct = locale === "ar" && product?.translation ? product.translation : product;
	const firstImage = product.thumbnail;
	const description = localizedProduct?.description
		? parser.parse(JSON.parse(localizedProduct?.description))
		: null;

	const variants = product.variants;
	const selectedVariantID = searchParams.variant;
	const selectedVariant = variants?.find(({ id }) => id === selectedVariantID);

	async function addItem() {
		"use server";

		const checkout = await Checkout.findOrCreate({
			checkoutId: await Checkout.getIdFromCookies(params.channel),
			channel: params.channel,
			locale: locale,
		});
		invariant(checkout, "This should never happen");

		await Checkout.saveIdToCookie(params.channel, checkout.id);

		if (!selectedVariantID) {
			return;
		}

		// TODO: error handling
		await executeGraphQL(CheckoutAddLineDocument, {
			variables: {
				id: checkout.id,
				productVariantId: decodeURIComponent(selectedVariantID),
			},
			cache: "no-cache",
		});

		revalidatePath("/cart");
	}

	const isAvailable = variants?.some((variant) => variant.quantityAvailable) ?? false;

	const price = selectedVariant?.pricing?.price?.gross
		? formatMoney(selectedVariant.pricing.price.gross.amount, selectedVariant.pricing.price.gross.currency)
		: isAvailable
			? formatMoneyRange({
					start: product?.pricing?.priceRange?.start?.gross,
					stop: product?.pricing?.priceRange?.stop?.gross,
				})
			: "";

	const productJsonLd: WithContext<Product> = {
		"@context": "https://schema.org",
		"@type": "Product",
		image: product.thumbnail?.url,
		...(selectedVariant
			? {
					name: `${localizedProduct.name} - ${selectedVariant.name}`,
					description:
						localizedProduct.seoDescription || `${localizedProduct.name} - ${selectedVariant.name}`,
					offers: {
						"@type": "Offer",
						availability: selectedVariant.quantityAvailable
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: selectedVariant.pricing?.price?.gross.currency,
						price: selectedVariant.pricing?.price?.gross.amount,
					},
				}
			: {
					name: localizedProduct.name ?? product.name ?? "",

					description: localizedProduct.seoDescription || product.seoDescription || "",
					offers: {
						"@type": "AggregateOffer",
						availability: product.variants?.some((variant) => variant.quantityAvailable)
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: product.pricing?.priceRange?.start?.gross.currency,
						lowPrice: product.pricing?.priceRange?.start?.gross.amount,
						highPrice: product.pricing?.priceRange?.stop?.gross.amount,
					},
				}),
	};

	return (
		<section className="mx-auto grid max-w-7xl p-8">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productJsonLd),
				}}
			/>
			<form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-8" action={addItem}>
				<div className="md:col-span-1 lg:col-span-5">
					{firstImage && (
						<ProductImageWrapper
							priority={true}
							alt={firstImage.alt ?? ""}
							width={1024}
							height={1024}
							src={firstImage.url}
						/>
					)}
				</div>
				<div className="flex flex-col pt-6 sm:col-span-1 sm:px-6 sm:pt-0 lg:col-span-3 lg:pt-16">
					<div>
						<h1 className="mb-4 flex-auto text-3xl font-medium tracking-tight text-neutral-900">
							{localizedProduct?.name}
						</h1>
						<p className="mb-8 text-sm " data-testid="ProductElement_Price">
							{price}
						</p>
						{variants && (
							<VariantSelector
								selectedVariant={selectedVariant}
								variants={variants}
								product={product}
								channel={params.channel}
							/>
						)}
						<AvailabilityMessage isAvailable={isAvailable} />
						<div className="mt-8">
							<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
						</div>
						{description && (
							<div className="mt-8 space-y-6 text-sm text-neutral-500">
								{description.map((content) => (
									<div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
								))}
							</div>
						)}
					</div>
				</div>
			</form>
		</section>
	);
}
