import { useEffect, useMemo } from "react";
import { useLocale } from "next-intl";

import { type Checkout, useCheckoutQuery } from "@/checkout/graphql";
import { getCheckoutLanguageCode } from "@/checkout/lib/checkoutMessages";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { useCheckoutUpdateStateActions } from "@/checkout/state/updateStateStore";

export const useCheckout = ({ pause = false } = {}) => {
	const id = useMemo(() => extractCheckoutIdFromUrl(), []);
	const locale = useLocale();
	const { setLoadingCheckout } = useCheckoutUpdateStateActions();

	const [{ data, fetching, stale }, refetch] = useCheckoutQuery({
		variables: { id, languageCode: getCheckoutLanguageCode(locale) },
		pause: pause,
	});

	useEffect(() => setLoadingCheckout(fetching || stale), [fetching, setLoadingCheckout, stale]);

	return useMemo(
		() => ({ checkout: data?.checkout as Checkout, fetching: fetching || stale, refetch }),
		[data?.checkout, fetching, refetch, stale],
	);
};
