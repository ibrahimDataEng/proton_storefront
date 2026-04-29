"use client";

// Covers notFound() calls from: categories/[slug], collections/[slug],
// pages/[slug], products/page, search/page — all within (main) route group.
// Renders inside full layout (header + footer visible). next-intl works here.

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export default function MainNotFound() {
	const t = useTranslations("notFound");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-16 text-center">
			{/* Compass SVG — circle draws in, needle spins then settles off-course */}
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 120 120"
				className="mb-8 h-32 w-32 text-brand-muted"
				aria-hidden="true"
				initial={{ opacity: 0, scale: 0.85 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* Outer ring */}
				<motion.circle
					cx="60"
					cy="60"
					r="48"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					opacity={0.25}
					pathLength={1}
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.9, ease: "easeInOut" }}
				/>
				{/* Inner ring */}
				<motion.circle
					cx="60"
					cy="60"
					r="36"
					fill="none"
					stroke="currentColor"
					strokeWidth="1"
					opacity={0.12}
					pathLength={1}
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.7, ease: "easeInOut", delay: 0.2 }}
				/>
				{/* Cardinal tick marks — N, E, S, W */}
				{[0, 90, 180, 270].map((angle, i) => {
					const rad = ((angle - 90) * Math.PI) / 180;
					const x1 = 60 + 44 * Math.cos(rad);
					const y1 = 60 + 44 * Math.sin(rad);
					const x2 = 60 + 36 * Math.cos(rad);
					const y2 = 60 + 36 * Math.sin(rad);
					return (
						<motion.line
							key={angle}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							opacity={0.45}
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.45 }}
							transition={{ delay: 0.6 + i * 0.08, duration: 0.25 }}
						/>
					);
				})}
				{/* Center dot */}
				<circle cx="60" cy="60" r="3.5" fill="currentColor" opacity={0.5} />
				{/* Compass needle — spins and settles at a "wrong" diagonal angle */}
				<motion.g
					style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
					animate={{ rotate: [0, 720, 840] }}
					transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
				>
					{/* North half (solid, primary colour) */}
					<polygon points="60,18 55.5,58 64.5,58" fill="currentColor" opacity={0.85} />
					{/* South half (light) */}
					<polygon points="60,102 55.5,62 64.5,62" fill="currentColor" opacity={0.2} />
				</motion.g>
			</motion.svg>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="flex flex-col items-center gap-3"
			>
				<h1 className="text-2xl font-semibold text-content-primary">{t("title")}</h1>
				<p className="max-w-sm text-content-secondary">{t("subtitle")}</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.6, duration: 0.4 }}
				className="mt-8 flex flex-wrap justify-center gap-3"
			>
				<LinkWithChannel
					href="/"
					className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
				>
					{t("goHome")}
				</LinkWithChannel>
				<LinkWithChannel
					href="/products"
					className="inline-flex items-center justify-center rounded-lg border border-line-default px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
				>
					{t("browse")}
				</LinkWithChannel>
			</motion.div>
		</div>
	);
}
