import { useLocale } from "next-intl";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getCheckoutLanguageCode } from "@/checkout/lib/checkoutMessages";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();
	const locale = useLocale();

	const [{ data, fetching: loading }] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: getCheckoutLanguageCode(locale), id: orderId as string },
	});

	return { order: data?.order as OrderFragment, loading };
};
