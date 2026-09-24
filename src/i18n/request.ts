import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { createGetMessageFallback, createOnError } from "./messageFallback";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
	const messages = (await import(`../messages/${locale}.json`)).default as Record<string, unknown>;

	return {
		locale,
		messages,
		// Same policy as the client provider (IntlClientProvider) — see messageFallback.ts.
		getMessageFallback: createGetMessageFallback(messages),
		onError: createOnError(locale),
	};
});
