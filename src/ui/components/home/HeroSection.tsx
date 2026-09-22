import Image from "next/image";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// CTA link base classes — shared between both CTAs for consistent sizing
const ctaBase =
	"inline-flex h-11 items-center justify-center rounded-md px-5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary";

export function HeroSection({ locale }: { locale: string }) {
	const isAr = locale === "ar";

	return (
		<section className="relative isolate min-h-[70dvh] bg-brand-primary md:min-h-[85dvh]">
			<Image
				src="/hero.png"
				alt={isAr ? "صورة البطل" : "Hero image"}
				fill
				priority
				sizes="100vw"
				className="absolute inset-0 -z-10 object-cover"
			/>

			{/* Scrim behind the text block only, confined to roughly the left half of the photo, for legibility regardless of local photo brightness */}
			<div
				aria-hidden="true"
				className="absolute inset-y-0 left-0 z-0 w-full bg-gradient-to-r from-black/55 via-black/25 to-transparent md:w-3/5 lg:w-1/2"
			/>

			{/*
			 * Physical `left-*` (not logical `start-*`) is intentional: the hero photo has a
			 * fixed empty/dark region on its physical left side regardless of reading direction,
			 * so this block must stay on that side in RTL instead of mirroring to the right —
			 * same documented exception as ContactPageClient's `valueDir="ltr"` bidi override
			 * (src/ui/components/contact/ContactPageClient.tsx).
			 */}
			<div className="absolute left-4 top-1/2 z-10 max-w-[240px] -translate-y-1/2 text-center md:left-12 md:max-w-[380px] lg:left-20 lg:max-w-[460px]">
				{/* Decorative accent line */}
				<div className="mx-auto mb-8 h-px w-16 bg-brand-accent" />

				<h1 className="text-4xl font-light text-content-footer md:text-6xl lg:text-7xl">
					{isAr ? "جودة تستحق ثقتك" : "Quality You Can Trust"}
				</h1>

				<p className="mx-auto mt-6 text-lg text-content-footer/70 md:text-xl">
					{isAr ? "مجموعات مختارة بعناية لذوق رفيع" : "Curated collections for the discerning eye"}
				</p>

				<div className="mt-10 flex flex-wrap justify-center gap-4">
					{/* Inverted primary CTA: link styled as a filled button. Uses the theme-invariant
					    footer token (not surface-base/brand-primary) since it sits on the always-dark
					    hero photo, not the page surface — a theme-flipping fill would turn near-black
					    in dark mode and disappear into the photo. */}
					<LinkWithChannel
						href="/products"
						className={`${ctaBase} bg-content-footer text-brand-primary hover:bg-content-footer/90 focus-visible:ring-content-footer`}
					>
						{isAr ? "تسوق الآن" : "Shop Now"}
					</LinkWithChannel>

					{/* Ghost CTA on the dark photo */}
					<LinkWithChannel
						href="/categories"
						className={`${ctaBase} border border-content-footer/30 text-content-footer hover:bg-content-footer/10 focus-visible:ring-content-footer`}
					>
						{isAr ? "عرض المجموعات" : "View Collections"}
					</LinkWithChannel>
				</div>
			</div>
		</section>
	);
}
