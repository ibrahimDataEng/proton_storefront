import Link from "next/link";
import { NavLink } from "./NavLink";
import { executeGraphQL } from "@/lib/graphql";
import { LanguageCodeEnum, MenuGetBySlugDocument } from "@/gql/graphql";

export function getLanguage(locale: string): LanguageCodeEnum {
	switch (locale) {
		case "en":
			return LanguageCodeEnum.EnUs;
		case "ar":
			return LanguageCodeEnum.Ar;
		default:
			return LanguageCodeEnum.EnUs;
	}
}

export const NavLinks = async ({ channel, locale }: { channel: string; locale: string }) => {
	console.log(locale);

	const language = getLanguage(locale);
	const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel, language: language },
		//revalidate: 60 * 60 * 24,
		revalidate: 1,
	});

	return (
		<>
			<NavLink href="/products">{locale === "ar" ? "الكل" : "All"}</NavLink>
			{navLinks.menu?.items?.map((item) => {
				if (item.category) {
					return (
						<NavLink key={item.id} href={`/categories/${item.category.slug}`}>
							{item.category.translation?.name || item.category.name}
						</NavLink>
					);
				}
				if (item.collection) {
					return (
						<NavLink key={item.id} href={`/collections/${item.collection.slug}`}>
							{item.collection.translation?.name || item.collection.name}
						</NavLink>
					);
				}
				if (item.page) {
					return (
						<NavLink key={item.id} href={`/pages/${item.page.slug}`}>
							{item.page.translation?.title || item.page.title}
						</NavLink>
					);
				}
				if (item.url) {
					return (
						<Link key={item.id} href={item.url}>
							{item.translation?.name || item.name}
						</Link>
					);
				}
				return null;
			})}
		</>
	);
};
