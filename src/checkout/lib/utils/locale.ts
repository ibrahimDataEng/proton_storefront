import { type CountryCode } from "@/checkout/graphql";
import { getCheckoutLocaleTag } from "@/checkout/lib/checkoutMessages";

export const getCurrentHref = () => location.href;

export const getCountryName = (countryCode: CountryCode): string =>
	new Intl.DisplayNames(getCheckoutLocaleTag(document.documentElement.lang), {
		type: "region",
	}).of(countryCode) || countryCode;
