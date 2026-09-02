export interface CountryOrigin {
	/** Matches the Saleor "origin-of-country" AttributeValue slug exactly. */
	slug: string;
	nameEn: string;
	nameAr: string;
	/** ISO 3166-1 alpha-2, lowercase — used as https://flagcdn.com/w160/{flagCode}.png */
	flagCode: string;
}

export const COUNTRY_ORIGINS: readonly CountryOrigin[] = [
	{ slug: "syria", nameEn: "Syria", nameAr: "سوريا", flagCode: "sy" },
	{ slug: "egypt", nameEn: "Egypt", nameAr: "مصر", flagCode: "eg" },
	{ slug: "india", nameEn: "India", nameAr: "الهند", flagCode: "in" },
	{ slug: "united-states", nameEn: "United States", nameAr: "الولايات المتحدة", flagCode: "us" },
	{ slug: "turkey", nameEn: "Turkey", nameAr: "تركيا", flagCode: "tr" },
	{ slug: "china", nameEn: "China", nameAr: "الصين", flagCode: "cn" },
	{ slug: "yemen", nameEn: "Yemen", nameAr: "اليمن", flagCode: "ye" },
	{ slug: "south-africa", nameEn: "South Africa", nameAr: "جنوب أفريقيا", flagCode: "za" },
	{ slug: "pakistan", nameEn: "Pakistan", nameAr: "باكستان", flagCode: "pk" },
	{ slug: "chile", nameEn: "Chile", nameAr: "تشيلي", flagCode: "cl" },
	{ slug: "nicaragua", nameEn: "Nicaragua", nameAr: "نيكاراغوا", flagCode: "ni" },
	{ slug: "iran", nameEn: "Iran", nameAr: "إيران", flagCode: "ir" },
	{ slug: "afghanistan", nameEn: "Afghanistan", nameAr: "أفغانستان", flagCode: "af" },
	{ slug: "vietnam", nameEn: "Vietnam", nameAr: "فيتنام", flagCode: "vn" },
	{ slug: "indonesia", nameEn: "Indonesia", nameAr: "إندونيسيا", flagCode: "id" },
	{ slug: "sri-lanka", nameEn: "Sri Lanka", nameAr: "سريلانكا", flagCode: "lk" },
	{ slug: "ethiopia", nameEn: "Ethiopia", nameAr: "إثيوبيا", flagCode: "et" },
	{ slug: "brazil", nameEn: "Brazil", nameAr: "البرازيل", flagCode: "br" },
	{ slug: "colombia", nameEn: "Colombia", nameAr: "كولومبيا", flagCode: "co" },
	{ slug: "sudan", nameEn: "Sudan", nameAr: "السودان", flagCode: "sd" },
	{ slug: "saudi-arabia", nameEn: "Saudi Arabia", nameAr: "السعودية", flagCode: "sa" },
	{ slug: "tunisia", nameEn: "Tunisia", nameAr: "تونس", flagCode: "tn" },
	{ slug: "morocco", nameEn: "Morocco", nameAr: "المغرب", flagCode: "ma" },
	{ slug: "lebanon", nameEn: "Lebanon", nameAr: "لبنان", flagCode: "lb" },
	{ slug: "spain", nameEn: "Spain", nameAr: "إسبانيا", flagCode: "es" },
	{ slug: "italy", nameEn: "Italy", nameAr: "إيطاليا", flagCode: "it" },
	{ slug: "greece", nameEn: "Greece", nameAr: "اليونان", flagCode: "gr" },
	{ slug: "australia", nameEn: "Australia", nameAr: "أستراليا", flagCode: "au" },
	{ slug: "argentina", nameEn: "Argentina", nameAr: "الأرجنتين", flagCode: "ar" },
	{ slug: "ivory-coast", nameEn: "Ivory Coast", nameAr: "ساحل العاج", flagCode: "ci" },
	{ slug: "madagascar", nameEn: "Madagascar", nameAr: "مدغشقر", flagCode: "mg" },
	{ slug: "uae", nameEn: "UAE", nameAr: "الإمارات", flagCode: "ae" },
] as const;

const COUNTRY_ORIGIN_BY_SLUG = new Map(COUNTRY_ORIGINS.map((country) => [country.slug, country]));

export function getCountryBySlug(slug: string): CountryOrigin | undefined {
	return COUNTRY_ORIGIN_BY_SLUG.get(slug);
}

export function getFlagUrl(flagCode: string, width: 80 | 160 | 320 = 160): string {
	return `https://flagcdn.com/w${width}/${flagCode}.png`;
}
