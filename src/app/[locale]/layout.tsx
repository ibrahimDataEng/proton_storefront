import { ReactNode, Suspense } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { DraftModeNotification } from "@/ui/components/DraftModeNotification";

type Props = {
    children: ReactNode;
    params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = params;

    let messages;
    try {
        messages = (await import(`../../locales/${locale}.json`)).default;
    } catch (error) {
        notFound(); // لو اللغة غير مدعومة
    }

    return (
        <html lang={locale} className="min-h-dvh">
            <body className="min-h-dvh">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    {children}
                    <Suspense>
                        <DraftModeNotification />
                    </Suspense>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
