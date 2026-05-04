import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export const COUNTRIES = [
	{ slug: "syria", nameEn: "Syria", nameAr: "سوريا", emoji: "🇸🇾" },
	{ slug: "egypt", nameEn: "Egypt", nameAr: "مصر", emoji: "🇪🇬" },
	{ slug: "india", nameEn: "India", nameAr: "الهند", emoji: "🇮🇳" },
	{ slug: "united-states", nameEn: "United States", nameAr: "الولايات المتحدة", emoji: "🇺🇸" },
	{ slug: "turkey", nameEn: "Turkey", nameAr: "تركيا", emoji: "🇹🇷" },
	{ slug: "china", nameEn: "China", nameAr: "الصين", emoji: "🇨🇳" },
	{ slug: "yemen", nameEn: "Yemen", nameAr: "اليمن", emoji: "🇾🇪" },
	{ slug: "south-africa", nameEn: "South Africa", nameAr: "جنوب أفريقيا", emoji: "🇿🇦" },
	{ slug: "pakistan", nameEn: "Pakistan", nameAr: "باكستان", emoji: "🇵🇰" },
	{ slug: "chile", nameEn: "Chile", nameAr: "تشيلي", emoji: "🇨🇱" },
	{ slug: "nicaragua", nameEn: "Nicaragua", nameAr: "نيكاراغوا", emoji: "🇳🇮" },
] as const;

export async function CountrySection({ channel: _channel, locale }: { channel: string; locale: string }) {
	const t = await getTranslations("home");
	const isAr = locale === "ar";

	return (
		<section className="bg-surface-base py-20 md:py-24">
			<Container>
				{/* Section header */}
				<div className="mb-12 text-center">
					<p className="mb-3 text-sm uppercase tracking-widest text-brand-accent">
						{isAr ? "المنشأ" : "Origin"}
					</p>
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">{t("shopByCountry")}</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				{/* Mobile: horizontal scroll; Desktop: centered wrap */}
				<div className="flex gap-4 overflow-x-auto pb-4 md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
					{COUNTRIES.map((country) => (
						<LinkWithChannel
							key={country.slug}
							href={`/products?country=${country.slug}`}
							className="flex min-w-[100px] shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface-raised p-4 text-center shadow-soft transition-all duration-200 hover:scale-105 hover:shadow-raised md:min-w-0"
						>
							<span
								className="text-5xl leading-none"
								role="img"
								aria-label={isAr ? country.nameAr : country.nameEn}
							>
								{country.emoji}
							</span>
							<span className="text-sm font-medium text-content-primary">
								{isAr ? country.nameAr : country.nameEn}
							</span>
						</LinkWithChannel>
					))}
				</div>
			</Container>
		</section>
	);
}
