"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
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

export function CountrySection({ channel: _channel, locale }: { channel: string; locale: string }) {
	const t = useTranslations("home");
	const isAr = locale === "ar";
	const [paused, setPaused] = useState(false);

	return (
		<section className="bg-surface-base py-20 md:py-24">
			<style>{`
				@keyframes marquee {
					0%   { transform: translateX(0); }
					100% { transform: translateX(-50%); }
				}
				.carousel-track {
					animation: marquee 25s linear infinite;
				}
			`}</style>

			<Container>
				{/* Section header */}
				<div className="mb-12 text-center">
					<p className="mb-3 text-sm uppercase tracking-widest text-brand-accent">
						{isAr ? "المنشأ" : "Origin"}
					</p>
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">{t("shopByCountry")}</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				{/* Carousel */}
				<div className="relative overflow-hidden">
					{/* Edge fades */}
					<div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-surface-base to-transparent" />
					<div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-surface-base to-transparent" />

					{/* Scrolling track — duplicated for seamless loop */}
					<div
						className="carousel-track flex gap-4 py-2"
						style={{ animationPlayState: paused ? "paused" : "running" }}
						onMouseEnter={() => setPaused(true)}
						onMouseLeave={() => setPaused(false)}
					>
						{/* Original set */}
						{COUNTRIES.map((country) => (
							<LinkWithChannel
								key={country.slug}
								href={`/products?country=${country.slug}`}
								className="flex min-w-[110px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-line-subtle bg-surface-raised p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-raised"
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

						{/* Clone set — hidden from assistive tech, skipped by keyboard */}
						<div aria-hidden="true" className="flex gap-4">
							{COUNTRIES.map((country) => (
								<LinkWithChannel
									key={`clone-${country.slug}`}
									href={`/products?country=${country.slug}`}
									tabIndex={-1}
									className="flex min-w-[110px] shrink-0 flex-col items-center gap-1 rounded-2xl border border-line-subtle bg-surface-raised p-4 text-center transition-all duration-200 hover:scale-105 hover:shadow-raised"
								>
									<Image
										src={`https://flagcdn.com/w160/${country.code}.png`}
										width={80}
										height={54}
										alt=""
										className="rounded-lg object-cover shadow-sm"
										style={{ width: "80px", height: "54px" }}
									/>
									<span className="mt-2 text-sm font-medium text-content-primary">
										{isAr ? country.nameAr : country.nameEn}
									</span>
								</LinkWithChannel>
							))}
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
