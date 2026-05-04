// Static content — replace with CMS/Saleor Pages query when ready
import Image from "next/image";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

const NUTS_IMAGE = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=1920&q=80";

export function BrandStorySection({ locale }: { locale: string }) {
	const isAr = locale === "ar";

	return (
		<section className="relative flex min-h-[500px] items-center overflow-hidden py-24 md:py-32">
			{/* Background image */}
			<Image src={NUTS_IMAGE} fill alt="مكسرات فاخرة" className="object-cover object-center" priority />

			{/* Dark overlay */}
			<div className="absolute inset-0 bg-black/60" />

			{/* Content */}
			<div className="relative z-10 w-full">
				<Container>
					<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
						{/* Decorative large quotation mark */}
						<div
							className="select-none text-center text-[200px] font-bold leading-none text-white/20 md:text-start"
							aria-hidden="true"
						>
							&ldquo;
						</div>

						{/* Content */}
						<div>
							<p className="mb-4 text-sm uppercase tracking-widest text-brand-accent">
								{isAr ? "قصتنا" : "Our Story"}
							</p>

							<h2 className="mb-6 text-3xl font-light text-white md:text-4xl">
								{isAr ? "صُنع بنية وإتقان" : "Crafted with Intention"}
							</h2>

							<p className="mb-8 max-w-prose text-lg leading-relaxed text-white/80">
								{isAr
									? "نؤمن بالثقة الهادئة التي تمنحها الأشياء المصنوعة بإتقان. كل قطعة في مجموعتنا مختارة لجودتها وقصتها وحضورها الدائم."
									: "We believe in the quiet confidence of well-made things. Each piece in our collection is chosen for its quality, its story, and its lasting presence."}
							</p>

							{/* Outline CTA on dark background */}
							<LinkWithChannel
								href="/pages/about"
								className="inline-flex h-11 items-center justify-center rounded-md border border-white/60 px-5 text-base font-medium text-white transition-colors hover:border-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
							>
								{isAr ? "اعرف أكثر" : "Learn More"}
							</LinkWithChannel>
						</div>
					</div>
				</Container>
			</div>
		</section>
	);
}
