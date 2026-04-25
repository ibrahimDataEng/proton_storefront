import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// CTA link base classes — shared between both CTAs for consistent sizing
const ctaBase =
	"inline-flex h-11 items-center justify-center rounded-md px-5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary";

export function HeroSection({ locale }: { locale: string }) {
	const isAr = locale === "ar";

	return (
		<section className="flex min-h-[70dvh] flex-col items-center justify-center bg-brand-primary px-4 py-16 text-center md:min-h-[85dvh]">
			{/* Decorative accent line */}
			<div className="mx-auto mb-8 h-px w-16 bg-brand-accent" />

			<h1 className="text-4xl font-light text-content-inverse md:text-6xl lg:text-7xl">
				{isAr ? "اكتشف الفخامة الهادئة" : "Discover Quiet Luxury"}
			</h1>

			<p className="mx-auto mt-6 max-w-[480px] text-lg text-content-inverse/70 md:text-xl">
				{isAr ? "مجموعات مختارة بعناية لذوق رفيع" : "Curated collections for the discerning eye"}
			</p>

			<div className="mt-10 flex flex-wrap justify-center gap-4">
				{/* Inverted primary CTA: link styled as a filled button */}
				<LinkWithChannel
					href="/products"
					className={`${ctaBase} bg-surface-base text-brand-primary hover:bg-surface-raised focus-visible:ring-surface-base`}
				>
					{isAr ? "تسوق الآن" : "Shop Now"}
				</LinkWithChannel>

				{/* Ghost CTA on dark background */}
				<LinkWithChannel
					href="/categories"
					className={`${ctaBase} border border-content-inverse/30 text-content-inverse hover:bg-content-inverse/10 focus-visible:ring-content-inverse`}
				>
					{isAr ? "عرض المجموعات" : "View Collections"}
				</LinkWithChannel>
			</div>
		</section>
	);
}
