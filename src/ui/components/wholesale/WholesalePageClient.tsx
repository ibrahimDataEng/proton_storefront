"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// ── Animation variants ────────────────────────────────────────────────────────

const containerStagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.12 } },
};

const fastStagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.07 } },
};

const wordStagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.055 } },
};

const fadeUp = {
	hidden: { opacity: 0, y: 28 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 260, damping: 24 },
	},
};

const wordFade = {
	hidden: { opacity: 0, y: 18 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 300, damping: 22 },
	},
};

const slideLeft = {
	hidden: { opacity: 0, x: -52 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: "spring" as const, stiffness: 240, damping: 26 },
	},
};

const slideRight = {
	hidden: { opacity: 0, x: 52 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: "spring" as const, stiffness: 240, damping: 26 },
	},
};

// ── Shared: WhatsApp icon ─────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
		</svg>
	);
}

// ── Shared: AnimatedCounter ───────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true });
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!inView) return;
		const DURATION = 1800;
		const STEPS = 65;
		const stepTime = DURATION / STEPS;
		let step = 0;
		const timer = setInterval(() => {
			step++;
			// Cubic ease-out
			const progress = step / STEPS;
			const eased = 1 - Math.pow(1 - progress, 3);
			setCount(Math.round(eased * target));
			if (step >= STEPS) {
				setCount(target);
				clearInterval(timer);
			}
		}, stepTime);
		return () => clearInterval(timer);
	}, [inView, target]);

	return (
		<span ref={ref}>
			{count}
			{suffix}
		</span>
	);
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────

function HeroSection() {
	const t = useTranslations("wholesale");
	const locale = useLocale();
	const ref = useRef(null);
	const inView = useInView(ref, { once: true });

	const waMessage = locale === "ar" ? t("cta.waMessageAr") : t("cta.waMessageEn");
	const waUrl = `https://wa.me/971558711442?text=${encodeURIComponent(waMessage)}`;

	const stats = [
		{ target: 200, suffix: "+", label: t("hero.stat1Label") },
		{ target: 15, suffix: "+", label: t("hero.stat2Label") },
		{ target: 10, suffix: "+", label: t("hero.stat3Label") },
		{ target: 5, suffix: "", label: t("hero.stat4Label") },
	];

	const headline = t("hero.headline");
	const words = headline.split(" ");

	return (
		<section ref={ref} className="relative overflow-hidden bg-brand-primary py-24 md:py-32">
			{/* Subtle radial gradient for depth */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: "radial-gradient(ellipse at 50% -5%, rgba(255,255,255,0.09) 0%, transparent 62%)",
				}}
				aria-hidden="true"
			/>
			{/* Bottom fade */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
				style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.08))" }}
				aria-hidden="true"
			/>

			<Container className="relative z-10">
				<motion.div
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="text-center"
				>
					{/* Word-by-word headline */}
					<motion.div variants={fadeUp}>
						<motion.h1
							variants={wordStagger}
							className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
						>
							{words.map((word, i) => (
								<motion.span key={i} variants={wordFade} className="me-[0.22em] inline-block last:me-0">
									{word}
								</motion.span>
							))}
						</motion.h1>
					</motion.div>

					{/* Subtitle */}
					<motion.p
						variants={fadeUp}
						className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl"
					>
						{t("hero.subtitle")}
					</motion.p>

					{/* Animated stat counters */}
					<motion.div
						variants={fastStagger}
						className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-5"
					>
						{stats.map((stat, i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								className="rounded-2xl bg-white/10 px-4 py-6 ring-1 ring-white/10 backdrop-blur-sm"
							>
								<p className="text-4xl font-extrabold tabular-nums text-white md:text-5xl">
									<AnimatedCounter target={stat.target} suffix={stat.suffix} />
								</p>
								<p className="mt-2 text-sm font-medium text-white/70 md:text-base">{stat.label}</p>
							</motion.div>
						))}
					</motion.div>

					{/* CTAs */}
					<motion.div
						variants={fadeUp}
						className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
					>
						{/* Request Pricing → WhatsApp */}
						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
							style={{ backgroundColor: "#25D366" }}
						>
							<WhatsAppIcon className="h-5 w-5 shrink-0" />
							{t("hero.ctaWhatsApp")}
						</a>

						{/* Browse Products */}
						<LinkWithChannel
							href="/products"
							className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:border-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						>
							{t("hero.ctaBrowse")}
						</LinkWithChannel>
					</motion.div>
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 2: Supply — What We Supply ───────────────────────────────────────

function SupplySection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	// TODO: replace with real product images (front_store-own-photos)
	const products = [
		{ emoji: "🥜", name: t("supply.product1") },
		{ emoji: "🌰", name: t("supply.product2") },
		{ emoji: "🫘", name: t("supply.product3") },
		{ emoji: "🌰", name: t("supply.product4") },
		{ emoji: "🍇", name: t("supply.product5") },
		{ emoji: "🌿", name: t("supply.product6") },
		{ emoji: "☕", name: t("supply.product7") },
		{ emoji: "🧆", name: t("supply.product8") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="mb-10 text-center"
				>
					<h2 className="text-3xl font-bold text-content-primary md:text-4xl">{t("supply.sectionTitle")}</h2>
					<p className="mt-3 text-content-secondary">{t("supply.sectionSubtitle")}</p>
				</motion.div>

				{/* Cards — horizontal scroll on mobile, 4-col grid on desktop */}
				<motion.div
					ref={ref}
					variants={fastStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="-mx-4 flex gap-4 overflow-x-auto pb-3 pe-4 ps-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:pe-0 md:ps-0"
					style={{ scrollbarWidth: "none" }}
				>
					{products.map((product, i) => (
						<motion.div
							key={i}
							variants={fadeUp}
							className="flex w-[148px] flex-shrink-0 flex-col items-center rounded-2xl border border-line-subtle bg-surface-raised p-5 shadow-soft transition-shadow hover:shadow-raised md:w-auto"
						>
							{/* TODO: replace with real product images (front_store-own-photos) */}
							<div className="flex h-20 w-20 items-center justify-center rounded-xl bg-brand-primary/10">
								<span className="text-4xl" role="img" aria-hidden="true">
									{product.emoji}
								</span>
							</div>
							<p className="mt-3 text-center font-semibold text-content-primary">{product.name}</p>
							<span className="mt-1.5 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-primary">
								{t("supply.bulkBadge")}
							</span>
						</motion.div>
					))}
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 3: Targets — Who Is This For? ────────────────────────────────────

function TargetsSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	const cards = [
		{ emoji: "🏪", title: t("targets.card1Title"), subtitle: t("targets.card1Subtitle") },
		{ emoji: "🏬", title: t("targets.card2Title"), subtitle: t("targets.card2Subtitle") },
		{ emoji: "🎁", title: t("targets.card3Title"), subtitle: t("targets.card3Subtitle") },
		{ emoji: "🏭", title: t("targets.card4Title"), subtitle: t("targets.card4Subtitle") },
	];

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<motion.div
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
				>
					{/* Section header */}
					<motion.div variants={fadeUp} className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-content-primary md:text-4xl">
							{t("targets.sectionTitle")}
						</h2>
						<p className="mt-3 text-content-secondary">{t("targets.sectionSubtitle")}</p>
					</motion.div>

					{/* 2×2 grid */}
					<div className="grid gap-5 sm:grid-cols-2">
						{cards.map((card, i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
								className="group relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-base p-6 shadow-soft transition-shadow hover:border-brand-primary/40 hover:shadow-raised"
							>
								{/* Accent bar on hover */}
								<div className="absolute inset-y-0 start-0 w-1 origin-center scale-y-0 rounded-s-2xl bg-brand-primary transition-transform duration-200 group-hover:scale-y-100" />
								<div className="ps-2">
									<span className="text-4xl" role="img" aria-hidden="true">
										{card.emoji}
									</span>
									<h3 className="mt-4 text-xl font-semibold text-content-primary">{card.title}</h3>
									<p className="mt-1.5 text-sm text-content-secondary">{card.subtitle}</p>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 4: Benefits — Why Choose Us (zigzag) ──────────────────────────────

interface BenefitRowProps {
	emoji: string;
	title: string;
	subtitle: string;
	index: number;
}

function BenefitRow({ emoji, title, subtitle, index }: BenefitRowProps) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.2 });
	const isEven = index % 2 === 0;

	return (
		<div ref={ref} className="grid items-center gap-8 md:grid-cols-2">
			{/* Image placeholder — alternates column position */}
			<motion.div
				variants={isEven ? slideLeft : slideRight}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				className={`relative flex h-56 items-center justify-center overflow-hidden rounded-2xl ${
					isEven ? "" : "md:order-2"
				}`}
			>
				{/* TODO: replace with real photo */}
				<div
					className="absolute inset-0"
					style={{
						background: isEven
							? "linear-gradient(135deg, rgba(45,106,79,0.12) 0%, rgba(45,106,79,0.05) 100%)"
							: "linear-gradient(135deg, rgba(45,106,79,0.08) 0%, rgba(45,106,79,0.14) 100%)",
					}}
				/>
				<div className="absolute inset-0 rounded-2xl border-2 border-dashed border-brand-primary/20" />
				<span className="relative text-8xl" role="img" aria-hidden="true">
					{emoji}
				</span>
			</motion.div>

			{/* Text */}
			<motion.div
				variants={isEven ? slideRight : slideLeft}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				className={isEven ? "" : "md:order-1"}
			>
				<h3 className="text-2xl font-bold text-content-primary md:text-3xl">{title}</h3>
				<p className="mt-3 text-base leading-relaxed text-content-secondary md:text-lg">{subtitle}</p>
				<div className="mt-5 h-1 w-14 rounded-full bg-brand-primary" />
			</motion.div>
		</div>
	);
}

function BenefitsSection() {
	const t = useTranslations("wholesale");

	const items = [
		{ emoji: "🚚", title: t("benefits.item1Title"), subtitle: t("benefits.item1Subtitle") },
		{ emoji: "📋", title: t("benefits.item2Title"), subtitle: t("benefits.item2Subtitle") },
		{ emoji: "👤", title: t("benefits.item3Title"), subtitle: t("benefits.item3Subtitle") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				<h2 className="mb-14 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("benefits.sectionTitle")}
				</h2>

				<div className="flex flex-col gap-14">
					{items.map((item, i) => (
						<BenefitRow key={i} index={i} emoji={item.emoji} title={item.title} subtitle={item.subtitle} />
					))}
				</div>
			</Container>
		</section>
	);
}

// ── Section 5: Steps — How It Works ──────────────────────────────────────────

function StepsSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.15 });

	const steps = [
		{ num: 1, title: t("steps.step1Title"), subtitle: t("steps.step1Subtitle") },
		{ num: 2, title: t("steps.step2Title"), subtitle: t("steps.step2Subtitle") },
		{ num: 3, title: t("steps.step3Title"), subtitle: t("steps.step3Subtitle") },
		{ num: 4, title: t("steps.step4Title"), subtitle: t("steps.step4Subtitle") },
	];

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<h2 className="mb-14 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("steps.sectionTitle")}
				</h2>

				{/* Mobile: vertical stepper */}
				<motion.ol
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="relative flex flex-col gap-0 md:hidden"
				>
					{steps.map((step, i) => (
						<motion.li key={step.num} variants={fadeUp} className="relative flex gap-5 pb-10 last:pb-0">
							{/* Connector line */}
							{i < steps.length - 1 && (
								<div className="absolute start-5 top-11 h-full w-0.5 -translate-x-1/2 bg-line-default rtl:translate-x-0 rtl:translate-x-1/2" />
							)}
							<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white ring-4 ring-surface-raised">
								{step.num}
							</div>
							<div className="pt-1.5">
								<h3 className="font-semibold text-content-primary">{step.title}</h3>
								<p className="mt-1 text-sm text-content-secondary">{step.subtitle}</p>
							</div>
						</motion.li>
					))}
				</motion.ol>

				{/* Desktop: horizontal timeline */}
				<motion.ol
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="relative hidden md:flex"
				>
					{/* Connecting line */}
					<div className="absolute end-0 start-0 top-5 h-0.5 bg-line-default" />

					{steps.map((step) => (
						<motion.li
							key={step.num}
							variants={fadeUp}
							className="relative flex flex-1 flex-col items-center px-3 text-center"
						>
							<div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white ring-4 ring-surface-raised">
								{step.num}
							</div>
							<h3 className="text-sm font-semibold text-content-primary md:text-base">{step.title}</h3>
							<p className="mt-1 text-xs text-content-secondary md:text-sm">{step.subtitle}</p>
						</motion.li>
					))}
				</motion.ol>
			</Container>
		</section>
	);
}

// ── Section 6: Certificates — Quality & Certifications (placeholder) ──────────

function CertificatesSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	return (
		<section className="py-16 md:py-24">
			<Container>
				<motion.div
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
				>
					<motion.div variants={fadeUp} className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-content-primary md:text-4xl">
							{t("certificates.sectionTitle")}
						</h2>
						<p className="mt-3 text-content-secondary">{t("certificates.sectionSubtitle")}</p>
					</motion.div>

					{/* TODO: add real certificates (ISO, Halal, etc.) */}
					<motion.div variants={fastStagger} className="grid gap-5 sm:grid-cols-3">
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line-default bg-surface-sunken px-6 py-10"
							>
								<div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line-default bg-surface-base">
									<div className="h-7 w-7 rounded-full bg-line-default" />
								</div>
								<div className="h-3 w-28 rounded-full bg-line-default" />
								<div className="h-2.5 w-20 rounded-full bg-line-subtle" />
								<span className="mt-1 rounded-full bg-surface-base px-3 py-1 text-xs font-medium text-content-secondary">
									{t("certificates.placeholder")}
								</span>
							</motion.div>
						))}
					</motion.div>
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 7: Testimonials (placeholder) ─────────────────────────────────────

function TestimonialsSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<motion.div
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
				>
					<motion.div variants={fadeUp} className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-content-primary md:text-4xl">
							{t("testimonials.sectionTitle")}
						</h2>
					</motion.div>

					{/* TODO: add real client testimonials */}
					<motion.div variants={fastStagger} className="grid gap-5 md:grid-cols-3">
						{[0, 1, 2].map((i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								className="rounded-2xl border border-line-subtle bg-surface-base p-6"
							>
								{/* Avatar + name skeleton */}
								<div className="flex items-center gap-3">
									<div className="h-11 w-11 rounded-full bg-line-subtle" />
									<div className="flex flex-col gap-2">
										<div className="h-3 w-24 rounded-full bg-line-subtle" />
										<div className="h-2.5 w-16 rounded-full bg-line-subtle" />
									</div>
								</div>
								{/* Text lines skeleton */}
								<div className="mt-5 flex flex-col gap-2.5">
									<div className="h-2.5 w-full rounded-full bg-line-subtle" />
									<div className="h-2.5 w-5/6 rounded-full bg-line-subtle" />
									<div className="h-2.5 w-3/4 rounded-full bg-line-subtle" />
								</div>
								<p className="mt-4 text-center text-xs text-content-secondary">
									{t("testimonials.placeholder")}
								</p>
							</motion.div>
						))}
					</motion.div>
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 8: FAQ ────────────────────────────────────────────────────────────

function FaqSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const faqs = [
		{ q: t("faq.q1"), a: t("faq.a1") },
		{ q: t("faq.q2"), a: t("faq.a2") },
		{ q: t("faq.q3"), a: t("faq.a3") },
		{ q: t("faq.q4"), a: t("faq.a4") },
		{ q: t("faq.q5"), a: t("faq.a5") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				<h2 className="mb-10 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("faq.sectionTitle")}
				</h2>

				<motion.div
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="mx-auto max-w-2xl divide-y divide-line-subtle"
				>
					{faqs.map((faq, i) => (
						<motion.div key={i} variants={fadeUp}>
							<button
								onClick={() => setOpenIndex(openIndex === i ? null : i)}
								aria-expanded={openIndex === i}
								className="flex w-full items-center justify-between gap-4 py-5 text-start"
							>
								<span className="font-medium text-content-primary">{faq.q}</span>
								<motion.span
									animate={{ rotate: openIndex === i ? 45 : 0 }}
									transition={{ type: "spring", stiffness: 320, damping: 22 }}
									className="shrink-0 text-2xl font-light leading-none text-brand-primary"
									aria-hidden="true"
								>
									+
								</motion.span>
							</button>

							<AnimatePresence initial={false}>
								{openIndex === i && (
									<motion.div
										key="answer"
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.24, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<p className="pb-5 leading-relaxed text-content-secondary">{faq.a}</p>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section 9: CTA — Final WhatsApp ──────────────────────────────────────────

function CtaSection() {
	const t = useTranslations("wholesale");
	const locale = useLocale();

	const waMessage = locale === "ar" ? t("cta.waMessageAr") : t("cta.waMessageEn");
	const waUrl = `https://wa.me/971558711442?text=${encodeURIComponent(waMessage)}`;

	return (
		<section className="relative overflow-hidden bg-brand-primary py-20 md:py-28">
			{/* Radial gradient */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: "radial-gradient(ellipse at 50% 110%, rgba(255,255,255,0.07) 0%, transparent 60%)",
				}}
				aria-hidden="true"
			/>

			<Container className="relative z-10">
				<div className="text-center">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, ease: "easeOut" }}
						className="text-4xl font-extrabold text-white md:text-5xl"
					>
						{t("cta.headline")}
					</motion.h2>

					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.12, duration: 0.5, ease: "easeOut" }}
						className="mt-4 text-lg text-white/80"
					>
						{t("cta.subtitle")}
					</motion.p>

					{/* WhatsApp button with pulse glow */}
					<motion.div
						initial={{ opacity: 0, scale: 0.88 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.22, type: "spring", stiffness: 260, damping: 20 }}
						className="relative mt-9 inline-block"
					>
						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="group relative inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
							style={{ backgroundColor: "#25D366" }}
						>
							<WhatsAppIcon className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110" />
							{t("cta.button")}

							{/* Pulse glow ring */}
							<span
								className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								style={{ boxShadow: "0 0 0 8px rgba(37,211,102,0.30), 0 0 0 16px rgba(37,211,102,0.12)" }}
								aria-hidden="true"
							/>
						</a>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.38 }}
						className="mt-5 text-sm text-white/55"
					>
						{t("cta.hours")}
					</motion.p>
				</div>
			</Container>
		</section>
	);
}

// ── Root export ───────────────────────────────────────────────────────────────

export function WholesalePageClient() {
	return (
		<main>
			<HeroSection />
			<SupplySection />
			<TargetsSection />
			<BenefitsSection />
			<StepsSection />
			<CertificatesSection />
			<TestimonialsSection />
			<FaqSection />
			<CtaSection />
		</main>
	);
}
