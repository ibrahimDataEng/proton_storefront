import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getRecentlyViewed } from "./actions";
import { executeGraphQL } from "@/lib/graphql";
import {
	AccountAddressValidationRulesDocument,
	CountryCode,
	CurrentUserOrderListDocument,
	ProductsBySlugsDocument,
	type ProductListItemFragment,
} from "@/gql/graphql";
import { Container } from "@/ui/components/Container";
import { AccountDashboard } from "@/ui/components/account/AccountDashboard";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { toCountryAreaOptions, type CountryAreaOption } from "@/lib/address/countryAreaChoices";
import { formatUaeDateTime, getReturnEligibility, getReturnStatus } from "@/lib/returns/returnMetadata";
import { type OrderReturnState } from "@/ui/components/account/sections/OrdersSection";

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

	// Return state per order, computed here on the server (one clock, one
	// formatter — no hydration mismatch at the 24h boundary). This only decides
	// what to SHOW; requestOrderReturn() re-verifies everything against a fresh
	// read before writing.
	const now = new Date();
	const returnStates: Record<string, OrderReturnState> = {};
	for (const edge of user.orders?.edges ?? []) {
		const order = edge.node;
		const eligibility = getReturnEligibility(order, now);
		returnStates[order.id] = {
			status: getReturnStatus(order.metadata),
			deadlineLabel: eligibility.eligible ? formatUaeDateTime(eligibility.deadline, locale) : null,
		};
	}

	// Emirate options for the address form (Saleor requires countryArea for AE).
	// Public, rarely-changing data — cached for a day. A failure only leaves the
	// select empty; it must never take the account page down.
	let emirateOptions: CountryAreaOption[] = [];
	try {
		const { addressValidationRules } = await executeGraphQL(AccountAddressValidationRulesDocument, {
			variables: { countryCode: CountryCode.Ae },
			withAuth: false,
			revalidate: 86400,
		});
		emirateOptions = toCountryAreaOptions(addressValidationRules?.countryAreaChoices, locale);
	} catch (error) {
		console.error("[account] addressValidationRules(AE) failed:", error);
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<AccountDashboard
					user={user}
					locale={locale}
					channel={channel}
					recentlyViewedProducts={recentlyViewedProducts}
					returnStates={returnStates}
					emirateOptions={emirateOptions}
				/>
			</Container>
		</main>
	);
}
