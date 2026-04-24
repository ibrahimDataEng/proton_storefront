import Link from "next/link";
import { getLocale } from "next-intl/server";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";

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
		<div className="min-h-dvh bg-white" dir={locale === "ar" ? "rtl" : "ltr"}>
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col p-8">
				<div className="flex items-center font-bold">
					<Link aria-label={locale === "ar" ? "الرئيسية" : "Home"} href={`/${locale}`}>
						Green Line Store
					</Link>
				</div>
				<h1 className="mt-8 text-3xl font-bold text-neutral-900">{locale === "ar" ? "الدفع" : "Checkout"}</h1>

				<section className="mb-12 mt-6 flex-1">
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>
		</div>
	);
}
