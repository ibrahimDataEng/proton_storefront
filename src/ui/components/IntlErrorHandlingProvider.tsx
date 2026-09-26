"use client";

import { useMemo, type ReactNode } from "react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { createGetMessageFallback, createOnError } from "@/i18n/messageFallback";

/**
 * Adds the missing-message policy (src/i18n/messageFallback.ts) on the client.
 *
 * next-intl's documented pattern for non-serializable provider props: the
 * server-rendered <NextIntlClientProvider> in [locale]/layout.tsx stays the
 * single source of config (locale, messages, now, timeZone, formats — all
 * inherited from i18n/request.ts), and this nested client provider adds ONLY
 * onError + getMessageFallback, which are functions and can't cross the RSC
 * boundary. use-intl's IntlProvider merges every omitted prop from the parent
 * context; `locale` is the one prop the client provider requires explicitly, so
 * it's read back from that same parent context rather than passed in.
 */
export function IntlErrorHandlingProvider({ children }: { children: ReactNode }) {
	const locale = useLocale();
	const messages = useMessages();

	const getMessageFallback = useMemo(() => createGetMessageFallback(messages), [messages]);
	const onError = useMemo(() => createOnError(locale), [locale]);

	return (
		<NextIntlClientProvider locale={locale} getMessageFallback={getMessageFallback} onError={onError}>
			{children}
		</NextIntlClientProvider>
	);
}
