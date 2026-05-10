import { BottomNavClient } from "./BottomNavClient";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";

interface BottomNavWrapperProps {
	locale: string;
}

export async function BottomNavWrapper({ locale }: BottomNavWrapperProps) {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return <BottomNavClient categories={categories} />;
}
