import { getTranslations } from "next-intl/server";
import { CategoryBreadcrumbDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Link } from "@/i18n/navigation";

interface BreadcrumbProps {
	categorySlug: string | null;
	locale: string;
	channel: string;
	mode?: "products" | "categories";
}

export async function Breadcrumb({ categorySlug, locale, channel, mode = "products" }: BreadcrumbProps) {
	const t = await getTranslations("products");
	const tCat = await getTranslations("categories");

	type Item = { label: string; href?: string };

	const secondItem: Item =
		mode === "categories"
			? { label: tCat("breadcrumbLabel"), href: `/${channel}/categories` }
			: { label: t("allProducts"), href: `/${channel}/products` };

	const items: Item[] = [{ label: t("home"), href: `/${channel}` }, secondItem];

	if (categorySlug) {
		const language = getSaleorLanguage(locale);
		const data = await executeGraphQL(CategoryBreadcrumbDocument, {
			variables: { slug: categorySlug, languageCode: language },
			revalidate: 60,
			withAuth: false,
		});

		const cat = data.category;
		if (cat) {
			if (cat.parent) {
				const parentName = cat.parent.translation?.name ?? cat.parent.name;
				const parentHref =
					mode === "categories"
						? `/${channel}/categories/${cat.parent.slug}`
						: `/${channel}/products?category=${cat.parent.slug}`;
				items.push({ label: parentName, href: parentHref });
			}
			const catName = cat.translation?.name ?? cat.name;
			items.push({ label: catName });
		}
	}

	const sep = locale === "ar" ? "‹" : "›";

	return (
		<nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-x-1 text-sm">
			{items.map((item, i) => {
				const isLast = i === items.length - 1;
				return (
					<span key={i} className="flex items-center gap-x-1">
						{i > 0 && <span className="text-content-secondary">{sep}</span>}
						{isLast || !item.href ? (
							<span className="font-medium text-content-primary">{item.label}</span>
						) : (
							<Link
								href={item.href}
								className="text-content-secondary transition-colors hover:text-brand-primary"
							>
								{item.label}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
