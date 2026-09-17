import { useEffect, useMemo, useRef } from "react";
import { useLocale } from "next-intl";

import { type Checkout, useCheckoutQuery } from "@/checkout/graphql";
import { getCheckoutLanguageCode } from "@/checkout/lib/checkoutMessages";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { useCheckoutUpdateStateActions } from "@/checkout/state/updateStateStore";

export const useCheckout = ({ pause = false } = {}) => {
	const id = useMemo(() => extractCheckoutIdFromUrl(), []);
	const locale = useLocale();
	const { setLoadingCheckout } = useCheckoutUpdateStateActions();

	const [{ data, fetching, stale, error }, refetch] = useCheckoutQuery({
		variables: { id, languageCode: getCheckoutLanguageCode(locale) },
		pause: pause,
	});

	useEffect(() => setLoadingCheckout(fetching || stale), [fetching, setLoadingCheckout, stale]);

	// This query is re-executed under the same urql operation key after every
	// mutation (the document-cache exchange's automatic post-write refetch), not
	// just by this hook's own refetch(). A transient network/HTTP/GraphQL error
	// on any of those re-executions replaces `data` with undefined even though
	// the checkout itself didn't change — every mounted caller of useCheckout()
	// (this component tree and every descendant hook that calls it directly)
	// would otherwise see `checkout` disappear mid-session (front_store-12e).
	// Fall back to the last successfully-fetched checkout while an error is
	// present; a genuine `checkout: null` response (no error) still flows
	// through as undefined so the real not-found case is unaffected.
	const lastGoodCheckout = useRef<Checkout | undefined>(undefined);
	useEffect(() => {
		if (data?.checkout) {
			lastGoodCheckout.current = data.checkout as Checkout;
		}
	}, [data?.checkout]);

	// Every other caller of this hook (many outside this session's edit scope)
	// assumes `checkout` is always defined once mounted — the pre-existing `as
	// Checkout` cast already asserted that, even though at runtime it could be
	// undefined; that assumption is unchanged here, only the runtime value
	// underneath it now falls back instead of going undefined on an error.
	const checkout = (data?.checkout ?? (error ? lastGoodCheckout.current : undefined)) as Checkout;
	const isRefetchError = !!error && !data?.checkout && !!checkout;

	return useMemo(
		() => ({ checkout, fetching: fetching || stale, refetch, error, isRefetchError }),
		[checkout, error, fetching, isRefetchError, refetch, stale],
	);
};
