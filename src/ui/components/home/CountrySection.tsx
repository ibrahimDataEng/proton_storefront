import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export const COUNTRIES = [
	{ slug: "syria", nameEn: "Syria", nameAr: "سوريا", code: "sy", emoji: "🇸🇾" },
	{ slug: "egypt", nameEn: "Egypt", nameAr: "مصر", code: "eg", emoji: "🇪🇬" },
	{ slug: "india", nameEn: "India", nameAr: "الهند", code: "in", emoji: "🇮🇳" },
	{ slug: "united-states", nameEn: "United States", nameAr: "الولايات المتحدة", code: "us", emoji: "🇺🇸" },
	{ slug: "turkey", nameEn: "Turkey", nameAr: "تركيا", code: "tr", emoji: "🇹🇷" },
	{ slug: "china", nameEn: "China", nameAr: "الصين", code: "cn", emoji: "🇨🇳" },
	{ slug: "yemen", nameEn: "Yemen", nameAr: "اليمن", code: "ye", emoji: "🇾🇪" },
	{ slug: "south-africa", nameEn: "South Africa", nameAr: "جنوب أفريقيا", code: "za", emoji: "🇿🇦" },
	{ slug: "pakistan", nameEn: "Pakistan", nameAr: "باكستان", code: "pk", emoji: "🇵🇰" },
	{ slug: "chile", nameEn: "Chile", nameAr: "تشيلي", code: "cl", emoji: "🇨🇱" },
	{ slug: "nicaragua", nameEn: "Nicaragua", nameAr: "نيكاراغوا", code: "ni", emoji: "🇳🇮" },
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
							className="flex min-w-[100px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-line-subtle bg-surface-raised p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-raised md:min-w-0"
						>
							<Image
								src={`https://flagcdn.com/w160/${country.code}.png`}
								width={80}
								height={54}
								alt={isAr ? country.nameAr : country.nameEn}
								className="rounded-lg object-cover shadow-sm"
								style={{ width: "80px", height: "54px" }}
							/>
							<span className="mt-2 text-sm font-medium text-content-primary">
								{isAr ? country.nameAr : country.nameEn}
							</span>
						</LinkWithChannel>
					))}
				</div>
			</Container>
		</section>
	);
}
