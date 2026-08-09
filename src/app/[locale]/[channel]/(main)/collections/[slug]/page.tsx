import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Container } from "@/ui/components/Container";
import { ProductList } from "@/ui/components/ProductList";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string; locale: string }> },
	parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const language = getSaleorLanguage(params.locale);
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel, language },
		//revalidate: 60,
		revalidate: 1,
	});

	return {
		title: `${collection?.name || "Collection"} | ${collection?.seoTitle || (await parent).title?.absolute}`,
		description:
			collection?.seoDescription || collection?.description || collection?.seoTitle || collection?.name,
	};
};

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}) {
	const params = await props.params;
	const language = getSaleorLanguage(params.locale);
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel, language },
		//revalidate: 60,
		revalidate: 1,
	});

	if (!collection || !collection.products) {
		notFound();
	}

	const { name, products } = collection;

	return (
		<Container className="pb-16 pt-8">
			<h1 className="pb-8 text-xl font-semibold text-content-primary">{name}</h1>
			<ProductList products={products.edges.map((e) => e.node)} />
		</Container>
	);
}
