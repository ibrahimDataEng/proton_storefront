import { redirect } from "next/navigation";

/**
 * Legacy route from the Saleor starter template. It rendered an English-only
 * login form backed by @saleor/auth-sdk's own cookies (not the storefront's
 * `saleor_token`), so it showed a login form even to signed-in customers. Nothing
 * links here; the redirect only keeps stray bookmarks working. Order history
 * lives in the account dashboard (/account, "My Orders").
 */
export default async function OrdersPage(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;
	redirect(`/${locale}/${channel}/account`);
}
