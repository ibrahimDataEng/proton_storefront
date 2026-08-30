import { CategoryChips } from "@/ui/components/CategoryChips";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";

interface CategoryChipsWrapperProps {
	locale: string;
	activeSlug?: string | null;
}

export async function CategoryChipsWrapper({ locale, activeSlug }: CategoryChipsWrapperProps) {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return <CategoryChips categories={categories} activeSlug={activeSlug} />;
}
