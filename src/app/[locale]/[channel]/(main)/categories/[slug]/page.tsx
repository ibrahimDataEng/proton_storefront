import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { LanguageCodeEnum, ProductListByCategoryDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Container } from "@/ui/components/Container";
import { ProductList } from "@/ui/components/ProductList";

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

	if (!category || !category.products) {
		notFound();
	}

	const localizedCategory = locale === "ar" && category?.translation ? category.translation : category;
	const name = localizedCategory?.name || category.name;
	const products = category.products;

	return (
		<Container className="pb-16 pt-8">
			<h1 className="pb-8 text-xl font-semibold text-content-primary">{name}</h1>
			<ProductList products={products.edges.map((e) => e.node)} />
		</Container>
	);
}
