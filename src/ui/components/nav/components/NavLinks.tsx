import { NavLink } from "./NavLink";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { ShopNavItem } from "@/ui/components/nav/ShopNavItem";

interface NavLinksProps {
	channel: string;
	locale: string;
	mobile?: boolean;
}

// Server component — cannot use hooks; translations via getTranslations would require
// async import but next-intl server usage needs the async API.
// We pass locale as a prop and derive labels inline.
function getLabel(key: string, locale: string): string {
	const labels: Record<string, Record<string, string>> = {
		home: { en: "Home", ar: "الرئيسية" },
		wholesale: { en: "Wholesale", ar: "الجملة" },
		contact: { en: "Contact Us", ar: "تواصل معنا" },
	};
	return labels[key]?.[locale] ?? labels[key]?.["en"] ?? key;
}

export const NavLinks = async ({ locale, mobile = false }: NavLinksProps) => {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return (
		<>
			<NavLink href="/">{getLabel("home", locale)}</NavLink>

			<ShopNavItem categories={categories} mobile={mobile} />

			<NavLink href="/pages/wholesale">{getLabel("wholesale", locale)}</NavLink>

			<NavLink href="/pages/contact-us">{getLabel("contact", locale)}</NavLink>
		</>
	);
};
