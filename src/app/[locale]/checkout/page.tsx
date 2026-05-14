import Link from "next/link";
import { getLocale } from "next-intl/server";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";
import { CheckoutTrustBar } from "@/ui/components/checkout/CheckoutTrustBar";
import { CheckoutWhatsApp } from "@/ui/components/checkout/CheckoutWhatsApp";

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

	return (
		<div className="min-h-dvh bg-[#f8faf9]" dir={locale === "ar" ? "rtl" : "ltr"}>
			<header className="border-b border-neutral-100 bg-white">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
					<Link
						aria-label={locale === "ar" ? "الرئيسية" : "Home"}
						href={`/${locale}`}
						className="text-lg font-bold text-[#2d6a4f]"
					>
						Green Line Store
					</Link>
					<a
						href="https://wa.me/971558711442"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-[#2d6a4f] hover:underline"
					>
						{locale === "ar" ? "تحتاج مساعدة؟" : "Need help?"}
					</a>
				</div>
			</header>
			<CheckoutTrustBar />
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col px-8 pb-8 pt-6">
				<h1 className="mb-6 text-2xl font-bold text-neutral-800">{locale === "ar" ? "الدفع" : "Checkout"}</h1>
				<section className="mb-12 flex-1">
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>
			<CheckoutWhatsApp />
		</div>
	);
}
