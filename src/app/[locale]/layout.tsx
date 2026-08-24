import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MotionProvider } from "@/ui/components/MotionProvider";
import { routing } from "@/i18n/routing";

const plexSans = IBM_Plex_Sans({
	subsets: ["latin", "latin-ext"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-plex-sans",
	display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
	subsets: ["arabic"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-plex-arabic",
	display: "swap",
});

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	setRequestLocale(locale);
	const isRTL = locale === "ar";

	let messages;
	try {
		messages = (await import(`@/messages/${locale}.json`)).default;
	} catch (error) {
		messages = {};
	}
	return (
		<html lang={locale} dir={isRTL ? "rtl" : "ltr"} className={`${plexSans.variable} ${plexArabic.variable}`}>
			<body className="bg-surface-base font-sans text-content-primary">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<MotionProvider>{children}</MotionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
