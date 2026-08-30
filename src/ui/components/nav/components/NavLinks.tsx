import { NavLink } from "./NavLink";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesWithChildrenDocument } from "@/gql/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { ShopNavItem } from "@/ui/components/nav/ShopNavItem";

interface NavLinksProps {
	channel: string;
	locale: string;
}

function getLabel(key: string, locale: string): string {
	const labels: Record<string, Record<string, string>> = {
		home: { en: "Home", ar: "الرئيسية" },
		wholesale: { en: "Wholesale", ar: "الجملة" },
		supplier: { en: "Become a Supplier", ar: "كن مورّداً لنا" },
		contact: { en: "Contact Us", ar: "تواصل معنا" },
	};
	return labels[key]?.[locale] ?? labels[key]?.["en"] ?? key;
}

/** Desktop nav items only. Mobile nav is handled by MobileDrawer. */
export const NavLinks = async ({ locale }: NavLinksProps) => {
	const language = getSaleorLanguage(locale);

	const data = await executeGraphQL(CategoriesWithChildrenDocument, {
		variables: { language },
		revalidate: 300,
	});

	const categories = data.categories?.edges.map((e) => e.node) ?? [];

	return (
		<>
			<NavLink href="/">{getLabel("home", locale)}</NavLink>

			<ShopNavItem categories={categories} />

			<NavLink href="/pages/wholesale">{getLabel("wholesale", locale)}</NavLink>

			<NavLink href="/pages/become-supplier">{getLabel("supplier", locale)}</NavLink>

			<NavLink href="/pages/contact-us">{getLabel("contact", locale)}</NavLink>
		</>
	);
};
