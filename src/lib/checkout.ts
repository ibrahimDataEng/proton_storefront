import { cookies } from "next/headers";
import { CheckoutCreateDocument, CheckoutFindDocument, LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export async function getIdFromCookies(channel: string) {
	const cookieName = `checkoutId-${channel}`;
	const checkoutId = (await cookies()).get(cookieName)?.value || "";
	return checkoutId;
}

export async function saveIdToCookie(channel: string, checkoutId: string) {
	const shouldUseHttps =
		process.env.NEXT_PUBLIC_STOREFRONT_URL?.startsWith("https") || !!process.env.NEXT_PUBLIC_VERCEL_URL;
	const cookieName = `checkoutId-${channel}`;
	(await cookies()).set(cookieName, checkoutId, {
		sameSite: "lax",
		secure: shouldUseHttps,
	});
}

export async function find(checkoutId: string, locale: string) {
	try {
		const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
		const { checkout } = checkoutId
			? await executeGraphQL(CheckoutFindDocument, {
					variables: {
						id: checkoutId,
						language: language,
					},
					cache: "no-cache",
				})
			: { checkout: null };

		return checkout;
	} catch {
		// we ignore invalid ID or checkout not found
	}
}

/**
 * Finds an existing checkout by ID, or creates a fresh one if it's missing,
 * stale, or already associated with a completed order.
 *
 * This function performs GraphQL reads/writes only — it does NOT write any
 * cookie. Callers in Server Action or Route Handler contexts are responsible
 * for persisting the returned checkout ID to a cookie via saveIdToCookie().
 * Do NOT call this from a plain Server Component render — cookies() can only
 * be written in a Server Action or Route Handler, so use find() there instead.
 */
export async function findOrCreate({
	channel,
	checkoutId,
	locale,
}: {
	checkoutId?: string;
	channel: string;
	locale: string;
}) {
	if (checkoutId) {
		const checkout = await find(checkoutId, locale);
		if (checkout) {
			// If this checkout has an associated order, it was completed —
			// treat it as stale and create a fresh one
			// Session 25: stale checkout fix
			const hasOrder = !!(checkout as unknown as { order?: { id: string } }).order?.id;
			if (!hasOrder) return checkout;
		}
		// checkout is null/undefined or was completed — fall through to create fresh
	}
	const fresh = (await create({ channel, locale })).checkoutCreate?.checkout;
	return fresh;
}

export const create = ({ channel, locale }: { channel: string; locale: string }) => {
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;

	return executeGraphQL(CheckoutCreateDocument, { cache: "no-cache", variables: { channel, language } });
};
