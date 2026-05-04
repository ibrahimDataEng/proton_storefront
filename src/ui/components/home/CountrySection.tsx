"use client";

import Image from "next/image";
import { useRef, useState } from "react";
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

	const trackRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);

	function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
		if (!trackRef.current) return;
		setIsDragging(true);
		setStartX(e.pageX - trackRef.current.offsetLeft);
		setScrollLeft(trackRef.current.scrollLeft);
	}

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (!isDragging || !trackRef.current) return;
		e.preventDefault();
		const x = e.pageX - trackRef.current.offsetLeft;
		trackRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
	}

	function handleDragEnd() {
		setIsDragging(false);
	}

	return (
		<section className="bg-surface-base py-20 md:py-24">
			<style>{`.country-track::-webkit-scrollbar { display: none; }`}</style>

			<Container>
				{/* Section header */}
				<div className="mb-12 text-center">
					<p className="mb-3 text-sm uppercase tracking-widest text-brand-accent">
						{isAr ? "المنشأ" : "Origin"}
					</p>
					<h2 className="text-3xl font-light text-content-primary md:text-4xl">{t("shopByCountry")}</h2>
					<div className="mx-auto mt-4 h-px w-12 bg-brand-accent" />
				</div>

				{/* Drag-to-scroll carousel */}
				<div className="relative">
					{/* Edge fades */}
					<div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-surface-base to-transparent" />
					<div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-surface-base to-transparent" />

					{/* Scrollable track */}
					<div
						ref={trackRef}
						className="country-track flex select-none gap-4 overflow-x-auto py-2"
						style={{
							cursor: isDragging ? "grabbing" : "grab",
							scrollbarWidth: "none",
						}}
						onMouseDown={handleMouseDown}
						onMouseMove={handleMouseMove}
						onMouseUp={handleDragEnd}
						onMouseLeave={handleDragEnd}
					>
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
					</div>
				</div>
			</Container>
		</section>
	);
}
