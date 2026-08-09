import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

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
	const { channel, locale } = await params;
	const t = await getTranslations("categories");

	const data = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel, language: getSaleorLanguage(locale) },
		revalidate: 60,
	});

	const categoryItems = (data.menu?.items ?? []).filter(
		(item): item is typeof item & { category: NonNullable<typeof item.category> } =>
			item.category !== null && item.category !== undefined,
	);

	const colsClass =
		categoryItems.length <= 2
			? "md:grid-cols-2"
			: categoryItems.length === 3
				? "md:grid-cols-2 lg:grid-cols-3"
				: "md:grid-cols-2 lg:grid-cols-4";

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<h1 className="mb-10 text-2xl font-semibold text-content-primary">{t("allCategories")}</h1>

				{categoryItems.length === 0 ? (
					<p className="text-sm text-content-secondary">{t("noProducts")}</p>
				) : (
					<ul className={`grid grid-cols-1 gap-4 md:gap-6 ${colsClass}`} role="list">
						{categoryItems.map((item) => {
							const name = item.category.translation?.name ?? item.category.name;
							const slug = item.category.slug;

							return (
								<li key={item.id}>
									<LinkWithChannel
										href={`/categories/${slug}`}
										className="group flex h-full min-h-[160px] flex-col justify-between rounded-xl border border-line-subtle bg-surface-base p-8 shadow-sm transition-shadow hover:border-brand-accent hover:shadow-md md:p-10"
									>
										<span className="text-xl font-medium text-content-primary">{name}</span>
										<ArrowRight
											size={16}
											className="self-end text-brand-accent transition-transform group-hover:translate-x-1"
											aria-hidden="true"
										/>
									</LinkWithChannel>
								</li>
							);
						})}
					</ul>
				)}
			</Container>
		</main>
	);
}
