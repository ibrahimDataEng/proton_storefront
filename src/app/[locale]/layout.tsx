import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTimeZone, setRequestLocale } from "next-intl/server";
import Script from "next/script";
import { MotionProvider } from "@/ui/components/MotionProvider";
import { ThemeInitializer } from "@/ui/components/ThemeInitializer";
import { IntlClientProvider } from "@/ui/components/IntlClientProvider";
import { routing } from "@/i18n/routing";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

	const timeZone = await getTimeZone();

	let messages;
	try {
		messages = (await import(`@/messages/${locale}.json`)).default;
	} catch (error) {
		messages = {};
	}
	return (
		<html
			lang={locale}
			dir={isRTL ? "rtl" : "ltr"}
			className={`${plexSans.variable} ${plexArabic.variable}`}
			suppressHydrationWarning
		>
			<head>
				{/* Applies the persisted theme before first paint to avoid a light/dark flash.
				    No prefers-color-scheme fallback — first-time visitors always default to light. */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{if(localStorage.getItem("theme")==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
					}}
				/>
			</head>
			<body className="bg-surface-base font-sans text-content-primary">
				<ThemeInitializer />
				<IntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
					<MotionProvider>{children}</MotionProvider>
				</IntlClientProvider>
				{gaMeasurementId && (
					<>
						<Script
							src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
							strategy="afterInteractive"
						/>
						<Script id="ga4-init" strategy="afterInteractive">
							{`window.dataLayer = window.dataLayer || [];
							function gtag(){window.dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('config', '${gaMeasurementId}');`}
						</Script>
					</>
				)}
			</body>
		</html>
	);
}
