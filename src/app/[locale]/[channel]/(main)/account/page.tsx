import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRecentlyViewed } from "./actions";
import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserOrderListDocument, ProductsBySlugsDocument, type ProductListItemFragment } from "@/gql/graphql";
import { Container } from "@/ui/components/Container";
import { AccountDashboard } from "@/ui/components/account/AccountDashboard";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { getSaleorLanguage } from "@/lib/saleor-language";

export default async function AccountPage(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

	if (!token) {
		redirect(`/${locale}/${channel}/login`);
	}

	let user;
	try {
		const data = await executeGraphQL(CurrentUserOrderListDocument, {
			cache: "no-cache",
			headers: { Authorization: `Bearer ${token}` },
		});
		user = data.me;
	} catch {
		redirect(`/${locale}/${channel}/login`);
	}

	if (!user) {
		redirect(`/${locale}/${channel}/login`);
	}

	// Resolve recently-viewed slugs into product cards, preserving newest-first
	// order and silently dropping any slug whose product was since deleted/unpublished.
	const recentlyViewed = await getRecentlyViewed();
	let recentlyViewedProducts: ProductListItemFragment[] = [];
	if (recentlyViewed.length > 0) {
		const language = getSaleorLanguage(locale);
		const { products } = await executeGraphQL(ProductsBySlugsDocument, {
			variables: { slugs: recentlyViewed.map((item) => item.slug), channel, language },
			cache: "no-cache",
		});
		const bySlug = new Map((products?.edges ?? []).map((edge) => [edge.node.slug, edge.node]));
		recentlyViewedProducts = recentlyViewed
			.map((item) => bySlug.get(item.slug))
			.filter((product): product is ProductListItemFragment => product != null);
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<AccountDashboard user={user} locale={locale} recentlyViewedProducts={recentlyViewedProducts} />
			</Container>
		</main>
	);
}
