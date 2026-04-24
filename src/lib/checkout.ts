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

export async function findOrCreate({
	channel,
	checkoutId,
	locale,
}: {
	checkoutId?: string;
	channel: string;
	locale: string;
}) {
	if (!checkoutId) {
		return (await create({ channel, locale })).checkoutCreate?.checkout;
	}
	const checkout = await find(checkoutId, locale);
	return checkout || (await create({ channel, locale })).checkoutCreate?.checkout;
}

export const create = ({ channel, locale }: { channel: string; locale: string }) => {
	const language = locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;

	return executeGraphQL(CheckoutCreateDocument, { cache: "no-cache", variables: { channel, language } });
};
