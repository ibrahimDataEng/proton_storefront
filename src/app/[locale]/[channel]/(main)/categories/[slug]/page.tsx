import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PackageX } from "lucide-react";
import { LanguageCodeEnum, ProductListByCategoryDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Container } from "@/ui/components/Container";
import { ProductList } from "@/ui/components/ProductList";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { EmptyState } from "@/ui/components/EmptyState";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string; locale: string }> },
	parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const locale = params.locale;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel, language: language },
		//revalidate: 60,
		revalidate: 1,
	});
	if (!category) {
		return { title: "Category · Saleor Storefront example", description: "" };
	}
	const localizedCategory = locale === "ar" && category?.translation ? category.translation : category;

	return {
		title: `${localizedCategory?.name || "Categroy"} | ${
			localizedCategory?.seoTitle || (await parent).title?.absolute
		}`,
		description:
			localizedCategory?.seoDescription ||
			localizedCategory?.description ||
			localizedCategory?.seoTitle ||
			localizedCategory?.name,
	};
};

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}) {
	const params = await props.params;
	const locale = params.locale;
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel, language: language },
		//revalidate: 60,
		revalidate: 1,
	});

	if (!category) {
		notFound();
	}

	const t = await getTranslations("categories");

	const localizedCategory = locale === "ar" && category?.translation ? category.translation : category;
	const name = localizedCategory?.name || category.name;
	const products = category.products?.edges.map((e) => e.node) ?? [];

	if (products.length === 0) {
		return (
			<Container className="pb-16 pt-8">
				<h1 className="pb-4 text-xl font-semibold text-content-primary">{name}</h1>
				<EmptyState
					icon={<PackageX size={56} aria-hidden="true" />}
					title={t("noProducts")}
					subtitle=""
					action={
						<LinkWithChannel
							href="/"
							className="inline-flex items-center justify-center rounded-md border border-transparent bg-brand-primary px-5 py-2.5 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
						>
							{t("backToHome")}
						</LinkWithChannel>
					}
				/>
			</Container>
		);
	}

	return (
		<Container className="pb-16 pt-8">
			<h1 className="pb-8 text-xl font-semibold text-content-primary">{name}</h1>
			<ProductList products={products} />
		</Container>
	);
}
