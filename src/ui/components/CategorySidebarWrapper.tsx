import { CategorySidebar } from "@/ui/components/CategorySidebar";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";

interface CategorySidebarWrapperProps {
	locale: string;
	activeSlug?: string | null;
}

export async function CategorySidebarWrapper({ locale, activeSlug }: CategorySidebarWrapperProps) {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return <CategorySidebar categories={categories} activeSlug={activeSlug} />;
}
