import { MobileNavClient } from "./MobileNavClient";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";

interface MobileDrawerWrapperProps {
	locale: string;
}

export async function MobileDrawerWrapper({ locale }: MobileDrawerWrapperProps) {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return <MobileNavClient categories={categories} />;
}
