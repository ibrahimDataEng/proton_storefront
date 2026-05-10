import { getTranslations } from "next-intl/server";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Container } from "@/ui/components/Container";
import { CategorySection } from "@/ui/components/categories/CategorySection";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "categories" });
	return { title: t("allCategories") };
}

export default async function CategoriesPage({
	params,
}: {
	params: Promise<{ channel: string; locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations("categories");
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const rootCategories = data.categories?.edges.map((e) => e.node) ?? [];

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<h1 className="mb-10 text-2xl font-semibold text-content-primary">{t("allCategories")}</h1>

				{rootCategories.length === 0 ? (
					<p className="text-sm text-content-secondary">{t("noProducts")}</p>
				) : (
					<div className="space-y-12">
						{rootCategories.map((cat, i) => (
							<CategorySection key={cat.id} category={cat} colorIndex={i} />
						))}
					</div>
				)}
			</Container>
		</main>
	);
}
