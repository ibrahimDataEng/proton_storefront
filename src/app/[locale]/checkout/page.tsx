import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";
import { CheckoutTrustBar } from "@/ui/components/checkout/CheckoutTrustBar";
import { CheckoutWhatsApp } from "@/ui/components/checkout/CheckoutWhatsApp";
import { CheckoutCountdown } from "@/ui/components/checkout/CheckoutCountdown";
import { CheckoutFooter } from "@/ui/components/checkout/CheckoutFooter";
import * as Checkout from "@/lib/checkout";

export async function generateMetadata() {
	const locale = await getLocale();

	return {
		title: locale === "ar" ? "الدفع · متجر Green Line" : "Checkout · Green Line Store",
	};
}

export default async function CheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const searchParams = await props.searchParams;
	const locale = await getLocale();

	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order) {
		return null;
	}

	// Fetch checkout channel slug for back-to-cart URL
	let checkoutChannel = "";
	if (searchParams.checkout) {
		try {
			const checkoutData = await Checkout.find(searchParams.checkout, locale);
			checkoutChannel = checkoutData?.channel?.slug ?? "";
		} catch {
			// silently ignore
		}
	}

	// Back-to-cart URL: use channel from checkout data, fall back to locale home
	const cartHref = checkoutChannel ? `/${locale}/${checkoutChannel}/cart` : `/${locale}`;

	return (
		<div className="min-h-dvh bg-[#FAF7F2]" dir={locale === "ar" ? "rtl" : "ltr"}>
			<header className="border-b border-neutral-100 bg-white">
				<div className="mx-auto flex min-h-[64px] max-w-7xl items-center px-6 md:px-8">
					{/* Left: Back to cart */}
					<div className="flex flex-1 items-center">
						<Link
							href={cartHref}
							aria-label={locale === "ar" ? "العودة للسلة" : "Back to cart"}
							className="group flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.5}
								className="transition-transform group-hover:-translate-x-0.5"
								aria-hidden="true"
							>
								<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
								<line x1="3" y1="6" x2="21" y2="6" />
								<path d="M16 10a4 4 0 01-8 0" />
							</svg>
							<span className="hidden sm:inline">{locale === "ar" ? "العودة للسلة" : "Back to cart"}</span>
						</Link>
					</div>

					{/* Center: Logo */}
					<div className="flex justify-center">
						<Link href={`/${locale}`} aria-label={locale === "ar" ? "الرئيسية" : "Home"}>
							<Image
								src="/logo.png"
								alt="Green Line Group"
								width={56}
								height={56}
								className="h-10 w-10 object-contain"
								priority
							/>
						</Link>
					</div>

					{/* Right: Need help (WhatsApp) */}
					<div className="flex flex-1 items-center justify-end">
						<a
							href="https://wa.me/971558711442"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-sm text-[#2d6a4f] transition-colors hover:text-[#235c43]"
						>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth={1.5}
								aria-hidden="true"
							>
								<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
							</svg>
							<span className="hidden sm:inline">{locale === "ar" ? "تحتاج مساعدة؟" : "Need help?"}</span>
						</a>
					</div>
				</div>
			</header>

			{/* Delivery countdown — client component, mounts after hydration */}
			<CheckoutCountdown />

			{/* Trust bar */}
			<CheckoutTrustBar />

			{/* Main checkout section */}
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 pb-8 pt-6 md:px-8">
				<h1 className="mb-6 text-2xl font-bold text-neutral-800">{locale === "ar" ? "الدفع" : "Checkout"}</h1>
				<section className="mb-6 flex-1 rounded-xl border border-neutral-100/80 bg-white p-4 shadow-sm md:p-8">
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>

			<CheckoutWhatsApp />
			<CheckoutFooter locale={locale} />
		</div>
	);
}
