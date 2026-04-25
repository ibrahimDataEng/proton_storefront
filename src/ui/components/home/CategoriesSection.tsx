import { ArrowRight } from "lucide-react";
import { LanguageCodeEnum, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// Categories are sourced from the "navbar" menu — same data as NavLinks.
// Items without a category link are filtered out.
// TODO: replace with a dedicated categories query when one is available.

function getLanguage(locale: string): LanguageCodeEnum {
	return locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
}

export async function CategoriesSection({ channel, locale }: { channel: string; locale: string }) {
	const isAr = locale === "ar";

	const data = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel, language: getLanguage(locale) },
		revalidate: 60,
	});

	const categoryItems = (data.menu?.items ?? []).filter(
		(item): item is typeof item & { category: NonNullable<typeof item.category> } =>
			item.category !== null && item.category !== undefined,
	);

	if (categoryItems.length === 0) {
		return null;
	}

	const colsClass =
		categoryItems.length <= 2
			? "md:grid-cols-2"
			: categoryItems.length === 3
				? "md:grid-cols-2 lg:grid-cols-3"
				: "md:grid-cols-2 lg:grid-cols-4";

	return (
		<section className="bg-surface-sunken py-20 md:py-24">
			<Container>
				{/* Section header */}
				<div className="mb-12 text-center">
					<p className="mb-3 text-sm uppercase tracking-widest text-brand-accent">
						{isAr ? "المجموعات" : "Collections"}
					</p>
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">
						{isAr ? "تسوق حسب الفئة" : "Shop by Category"}
					</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				<ul className={`grid grid-cols-1 gap-4 md:gap-6 ${colsClass}`} role="list">
					{categoryItems.map((item) => {
						const name = item.category.translation?.name ?? item.category.name;
						const slug = item.category.slug;

						return (
							<li key={item.id}>
								<LinkWithChannel
									href={`/categories/${slug}`}
									className="group flex h-full min-h-[160px] flex-col justify-between rounded-lg border border-line-subtle bg-surface-raised p-8 shadow-soft transition-shadow hover:border-brand-accent hover:shadow-raised md:p-10"
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
			</Container>
		</section>
	);
}
