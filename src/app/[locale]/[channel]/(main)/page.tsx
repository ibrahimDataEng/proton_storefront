import { HeroSection } from "@/ui/components/home/HeroSection";
import { FeaturedProductsSection } from "@/ui/components/home/FeaturedProductsSection";
import { CategoriesSection } from "@/ui/components/home/CategoriesSection";
import { BrandStorySection } from "@/ui/components/home/BrandStorySection";

export const revalidate = 60;

export const metadata = {
	title: "ACME Storefront, powered by Saleor & Next.js",
	description:
		"Storefront Next.js Example for building performant e-commerce experiences with Saleor - the composable, headless commerce platform for global brands.",
};

export default async function Page(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;

	return (
		<main>
			<HeroSection locale={locale} />
			<FeaturedProductsSection channel={channel} locale={locale} />
			<CategoriesSection channel={channel} locale={locale} />
			<BrandStorySection locale={locale} />
		</main>
	);
}
