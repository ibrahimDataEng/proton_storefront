import Link from "next/link";
import Image from "next/image";
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
		<div className="min-h-dvh bg-[#FAF7F2]" dir={locale === "ar" ? "rtl" : "ltr"}>
			<header className="border-b border-neutral-100 bg-white">
				<div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between px-8 py-2">
					<Link aria-label={locale === "ar" ? "الرئيسية" : "Home"} href={`/${locale}`}>
						<Image src="/logo.png" width={160} height={48} alt="Green Line Store" className="h-12 w-auto" />
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
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 pb-8 pt-6 md:px-8">
				<h1 className="mb-6 text-2xl font-bold text-neutral-800">{locale === "ar" ? "الدفع" : "Checkout"}</h1>
				<section className="mb-12 flex-1 rounded-xl border border-neutral-100/80 bg-white p-4 shadow-sm md:p-8">
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>
			<CheckoutWhatsApp />
		</div>
	);
}
