import { Suspense } from "react";
import { HeroSection } from "@/ui/components/home/HeroSection";
import { FeaturedProductsSection } from "@/ui/components/home/FeaturedProductsSection";
import { CategoriesSection } from "@/ui/components/home/CategoriesSection";
import { CountrySection } from "@/ui/components/home/CountrySection";
import { BrandStorySection } from "@/ui/components/home/BrandStorySection";
import { TrendingSection, TrendingSectionSkeleton } from "@/ui/components/home/TrendingSection";

export const revalidate = 60;

export const metadata = {
	title: "Tawasi Plus Store",
	description:
		"Tawasi Plus Store is a leading online retailer offering a wide range of products like nuts, dried fruits, coffee, spices and more at competitive prices. Shop with confidence and enjoy fast shipping and excellent customer service.",
};

export default async function Page(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;

	return (
		<main>
			<HeroSection locale={locale} />
			<FeaturedProductsSection channel={channel} locale={locale} />
			<Suspense fallback={<TrendingSectionSkeleton />}>
				<TrendingSection channel={channel} locale={locale} />
			</Suspense>
			<CategoriesSection channel={channel} locale={locale} />
			<CountrySection channel={channel} locale={locale} />
			<BrandStorySection locale={locale} />
		</main>
	);
}
