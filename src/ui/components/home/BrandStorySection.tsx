// Static content — replace with CMS/Saleor Pages query when ready
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export function BrandStorySection({ locale }: { locale: string }) {
	const isAr = locale === "ar";

	return (
		<section className="bg-brand-primary py-24 md:py-32">
			<Container>
				<div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
					{/* Decorative large quotation mark */}
					<div
						className="select-none text-center text-[200px] font-bold leading-none text-brand-accent/20 md:text-start"
						aria-hidden="true"
					>
						&ldquo;
					</div>

					{/* Content */}
					<div>
						<p className="mb-4 text-sm uppercase tracking-widest text-brand-accent">
							{isAr ? "قصتنا" : "Our Story"}
						</p>

						<h2 className="mb-6 text-3xl font-light text-content-inverse md:text-4xl">
							{isAr ? "صُنع بنية وإتقان" : "Crafted with Intention"}
						</h2>

						<p className="mb-8 max-w-prose text-lg leading-relaxed text-content-inverse/70">
							{isAr
								? "نؤمن بالثقة الهادئة التي تمنحها الأشياء المصنوعة بإتقان. كل قطعة في مجموعتنا مختارة لجودتها وقصتها وحضورها الدائم."
								: "We believe in the quiet confidence of well-made things. Each piece in our collection is chosen for its quality, its story, and its lasting presence."}
						</p>

						{/* Inverted CTA — same style as Hero */}
						<LinkWithChannel
							href="/pages/about"
							className="inline-flex h-11 items-center justify-center rounded-md bg-surface-base px-5 text-base font-medium text-brand-primary transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-base focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
						>
							{isAr ? "اعرف أكثر" : "Learn More"}
						</LinkWithChannel>
					</div>
				</div>
			</Container>
		</section>
	);
}
