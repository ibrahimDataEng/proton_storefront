"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { getFlagUrl, type CountryOrigin } from "@/lib/countryOrigin";

interface GalleryImage {
	url: string;
	alt: string | null;
}

interface Props {
	images: GalleryImage[];
	productName: string;
	originCountry?: CountryOrigin;
}

export function ProductGallery({ images, productName, originCountry }: Props) {
	const t = useTranslations("products");
	const locale = useLocale();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const originName = originCountry ? (locale === "ar" ? originCountry.nameAr : originCountry.nameEn) : null;

	const selectedUrl = images[selectedIndex]?.url ?? "";
	const selectedAlt = images[selectedIndex]?.alt ?? productName;

	const closeLightbox = useCallback(() => setLightboxOpen(false), []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeLightbox();
		};
		if (lightboxOpen) {
			document.addEventListener("keydown", onKey);
			return () => document.removeEventListener("keydown", onKey);
		}
	}, [lightboxOpen, closeLightbox]);

	if (images.length === 0) {
		return <div className="aspect-square w-full rounded-2xl bg-surface-sunken" />;
	}

	return (
		<>
			{/* Main image */}
			<div className="flex flex-col gap-3">
				<div
					className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-surface-sunken"
					onClick={() => setLightboxOpen(true)}
					role="button"
					tabIndex={0}
					aria-label={`Zoom in on ${selectedAlt}`}
					onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
				>
					<AnimatePresence mode="wait" initial={false}>
						<m.div
							key={selectedUrl}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="absolute inset-0"
						>
							<Image
								src={selectedUrl}
								alt={selectedAlt}
								fill
								sizes="(max-width: 768px) 100vw, 50vw"
								className="object-contain"
								priority
							/>
						</m.div>
					</AnimatePresence>
					{originCountry && originName && (
						<div className="absolute start-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-surface-base/90 px-2.5 py-1 shadow-soft backdrop-blur-sm">
							<Image
								src={getFlagUrl(originCountry.flagCode, 80)}
								alt=""
								width={20}
								height={14}
								className="rounded-sm object-cover"
							/>
							<span className="text-xs font-medium text-content-primary">
								{t("origin", { country: originName })}
							</span>
						</div>
					)}
					<div className="absolute bottom-3 right-3 rounded-lg bg-surface-base/80 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
						<ZoomIn className="h-4 w-4 text-content-secondary" aria-hidden="true" />
					</div>
				</div>

				{/* Thumbnails */}
				{images.length > 1 && (
					<div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Product images">
						{images.slice(0, 6).map((img, i) => (
							<button
								key={img.url}
								type="button"
								role="option"
								aria-selected={i === selectedIndex}
								onClick={() => setSelectedIndex(i)}
								className={`relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-surface-sunken transition-all ${
									i === selectedIndex
										? "border-2 border-brand-primary"
										: "border border-line-subtle hover:border-line-default"
								}`}
							>
								<Image
									src={img.url}
									alt={img.alt ?? productName}
									fill
									sizes="72px"
									className="object-contain"
								/>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Lightbox */}
			<AnimatePresence>
				{lightboxOpen && (
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
						onClick={closeLightbox}
						role="dialog"
						aria-modal="true"
						aria-label="Image lightbox"
					>
						<m.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="relative max-h-[90vh] max-w-[90vw]"
							onClick={(e) => e.stopPropagation()}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={selectedUrl}
								alt={selectedAlt}
								className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
							/>
						</m.div>
						<button
							type="button"
							onClick={closeLightbox}
							className="absolute right-4 top-4 rounded-full bg-surface-base/80 p-2 text-content-primary backdrop-blur-sm hover:bg-surface-raised"
							aria-label="Close lightbox"
						>
							<X className="h-5 w-5" aria-hidden="true" />
						</button>
					</m.div>
				)}
			</AnimatePresence>
		</>
	);
}
