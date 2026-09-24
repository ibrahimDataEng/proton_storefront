"use client";

import { useMemo, type ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { createGetMessageFallback, createOnError } from "@/i18n/messageFallback";

type Props = {
	locale: string;
	messages: AbstractIntlMessages;
	timeZone: string;
	children: ReactNode;
};

/**
 * NextIntlClientProvider with the missing-message policy from
 * src/i18n/messageFallback.ts. It has to be a client component: getMessageFallback
 * and onError are functions, which a Server Component can't pass as props.
 * `timeZone` is passed explicitly because only the server-rendered provider
 * inherits it from the request config automatically.
 */
export function IntlClientProvider({ locale, messages, timeZone, children }: Props) {
	const getMessageFallback = useMemo(() => createGetMessageFallback(messages), [messages]);
	const onError = useMemo(() => createOnError(locale), [locale]);

	return (
		<NextIntlClientProvider
			locale={locale}
			messages={messages}
			timeZone={timeZone}
			getMessageFallback={getMessageFallback}
			onError={onError}
		>
			{children}
		</NextIntlClientProvider>
	);
}
