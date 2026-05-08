"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/ui/components/Container";

// ── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
	hidden: { opacity: 0, y: 32 },
	visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
};

const slideLeft = {
	hidden: { opacity: 0, x: -48 },
	visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 240, damping: 26 } },
};

const slideRight = {
	hidden: { opacity: 0, x: 48 },
	visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 240, damping: 26 } },
};

// ── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true });
	const [count, setCount] = useState(0);
	const hasStarted = useRef(false);

	if (inView && !hasStarted.current) {
		hasStarted.current = true;
		const duration = 1400;
		const steps = 50;
		const increment = target / steps;
		let current = 0;
		const timer = setInterval(() => {
			current += increment;
			if (current >= target) {
				setCount(target);
				clearInterval(timer);
			} else {
				setCount(Math.floor(current));
			}
		}, duration / steps);
	}

	return (
		<span ref={ref}>
			{count}
			{suffix}
		</span>
	);
}

// ── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true });

	const stats = [
		{ value: 200, suffix: "+", label: t("hero.stat1Label") },
		{ value: 15, suffix: "+", label: t("hero.stat2Label") },
		{ value: 10, suffix: "+", label: t("hero.stat3Label") },
		{ value: 5, suffix: "", label: t("hero.stat4Label") },
	];

	return (
		<section className="bg-brand-primary py-20 md:py-28">
			<Container>
				<motion.div
					ref={ref}
					variants={stagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="text-center"
				>
					<motion.h1
						variants={fadeUp}
						className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
					>
						{t("hero.headline")}
					</motion.h1>
					<motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl text-lg text-white/80 md:text-xl">
						{t("hero.subtitle")}
					</motion.p>

					{/* Stats */}
					<motion.div variants={stagger} className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
						{stats.map((stat, i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								className="rounded-2xl bg-white/10 px-4 py-6 backdrop-blur-sm"
							>
								<p className="text-4xl font-extrabold text-white md:text-5xl">
									<AnimatedCounter target={stat.value} suffix={stat.suffix} />
								</p>
								<p className="mt-2 text-sm font-medium text-white/75 md:text-base">{stat.label}</p>
							</motion.div>
						))}
					</motion.div>
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section: Target Cards ────────────────────────────────────────────────────

function TargetsSection() {
	const t = useTranslations("wholesale");
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.15 });

	const cards = [
		{ emoji: "🏪", title: t("targets.card1Title"), subtitle: t("targets.card1Subtitle") },
		{ emoji: "🏬", title: t("targets.card2Title"), subtitle: t("targets.card2Subtitle") },
		{ emoji: "🎁", title: t("targets.card3Title"), subtitle: t("targets.card3Subtitle") },
		{ emoji: "🏭", title: t("targets.card4Title"), subtitle: t("targets.card4Subtitle") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					animate={inView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.5 }}
					className="mb-12 text-center text-3xl font-bold text-content-primary md:text-4xl"
				>
					{t("targets.sectionTitle")}
				</motion.h2>

				<motion.div
					ref={ref}
					variants={stagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="grid gap-6 sm:grid-cols-2"
				>
					{cards.map((card, i) => (
						<motion.div
							key={i}
							variants={fadeUp}
							whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
							className="group relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-raised p-6 shadow-soft transition-shadow hover:border-brand-primary/40 hover:shadow-raised"
						>
							<div className="absolute inset-y-0 start-0 w-1 origin-center scale-y-0 rounded-s-2xl bg-brand-primary transition-transform duration-200 group-hover:scale-y-100" />
							<div className="ps-2">
								<span className="text-4xl" role="img" aria-hidden="true">
									{card.emoji}
								</span>
								<h3 className="mt-4 text-xl font-semibold text-content-primary">{card.title}</h3>
								<p className="mt-2 text-content-secondary">{card.subtitle}</p>
							</div>
						</motion.div>
					))}
				</motion.div>
			</Container>
		</section>
	);
}

// ── Section: Benefits Zigzag ─────────────────────────────────────────────────

interface BenefitRowProps {
	emoji: string;
	title: string;
	subtitle: string;
	/** true = text on left / image on right (in LTR) */
	textLeft: boolean;
}

function BenefitRow({ emoji, title, subtitle, textLeft }: BenefitRowProps) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.2 });

	return (
		<div ref={ref} className="grid items-center gap-8 md:grid-cols-2">
			{/* Color block placeholder — order flips based on textLeft */}
			<motion.div
				variants={textLeft ? slideRight : slideLeft}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				className={`flex h-48 items-center justify-center rounded-2xl bg-brand-primary/10 ${
					textLeft ? "md:order-2" : "md:order-1"
				} order-1`}
			>
				<span className="text-7xl" role="img" aria-hidden="true">
					{emoji}
				</span>
			</motion.div>

			{/* Text */}
			<motion.div
				variants={textLeft ? slideLeft : slideRight}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				className={`${textLeft ? "md:order-1" : "md:order-2"} order-2`}
			>
				<h3 className="text-2xl font-bold text-content-primary md:text-3xl">{title}</h3>
				<p className="mt-3 text-lg text-content-secondary">{subtitle}</p>
				<div className="mt-4 h-1 w-12 rounded-full bg-brand-primary" />
			</motion.div>
		</div>
	);
}

function BenefitsSection() {
	const t = useTranslations("wholesale");
	const locale = useLocale();
	const isRtl = locale === "ar";

	const items = [
		{ emoji: "🚚", title: t("benefits.item1Title"), subtitle: t("benefits.item1Subtitle") },
		{ emoji: "📋", title: t("benefits.item2Title"), subtitle: t("benefits.item2Subtitle") },
		{ emoji: "👤", title: t("benefits.item3Title"), subtitle: t("benefits.item3Subtitle") },
	];

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<h2 className="mb-14 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("benefits.sectionTitle")}
				</h2>

				<div className="flex flex-col gap-12">
					{items.map((item, i) => {
						// In RTL, flip alternation so zigzag still reads naturally
						const textLeft = isRtl ? i % 2 !== 0 : i % 2 === 0;
						return (
							<BenefitRow
								key={i}
								emoji={item.emoji}
								title={item.title}
								subtitle={item.subtitle}
								textLeft={textLeft}
							/>
						);
					})}
				</div>
			</Container>
		</section>
	);
}

// ── Section: Steps Timeline ──────────────────────────────────────────────────

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
		<section className="py-16 md:py-24">
			<Container>
				<h2 className="mb-14 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("steps.sectionTitle")}
				</h2>

				{/* Mobile: vertical */}
				<motion.ol
					ref={ref}
					variants={stagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="relative flex flex-col gap-0 md:hidden"
				>
					{steps.map((step, i) => (
						<motion.li key={step.num} variants={fadeUp} className="relative flex gap-5 pb-10 last:pb-0">
							{/* Connector line */}
							{i < steps.length - 1 && (
								<div className="absolute start-5 top-12 h-full w-0.5 -translate-x-1/2 bg-line-default rtl:translate-x-0" />
							)}
							<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
								{step.num}
							</div>
							<div className="pt-1">
								<h3 className="font-semibold text-content-primary">{step.title}</h3>
								<p className="mt-1 text-sm text-content-secondary">{step.subtitle}</p>
							</div>
						</motion.li>
					))}
				</motion.ol>

				{/* Desktop: horizontal */}
				<motion.ol
					variants={stagger}
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
							className="relative flex flex-1 flex-col items-center px-4 text-center"
						>
							<div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white ring-4 ring-surface-base">
								{step.num}
							</div>
							<h3 className="font-semibold text-content-primary">{step.title}</h3>
							<p className="mt-1 text-sm text-content-secondary">{step.subtitle}</p>
						</motion.li>
					))}
				</motion.ol>
			</Container>
		</section>
	);
}

// ── Section: FAQ Accordion ───────────────────────────────────────────────────

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
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<h2 className="mb-10 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("faq.sectionTitle")}
				</h2>

				<motion.div
					ref={ref}
					variants={stagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="mx-auto max-w-2xl divide-y divide-line-subtle"
				>
					{faqs.map((faq, i) => (
						<motion.div key={i} variants={fadeUp}>
							<button
								onClick={() => setOpenIndex(openIndex === i ? null : i)}
								className="flex w-full items-center justify-between gap-4 py-5 text-start"
								aria-expanded={openIndex === i}
							>
								<span className="font-medium text-content-primary">{faq.q}</span>
								<motion.span
									animate={{ rotate: openIndex === i ? 45 : 0 }}
									transition={{ type: "spring", stiffness: 300, damping: 22 }}
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
										transition={{ duration: 0.25, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<p className="pb-5 text-content-secondary">{faq.a}</p>
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

// ── Section: CTA WhatsApp ────────────────────────────────────────────────────

function CtaSection() {
	const t = useTranslations("wholesale");

	const waUrl =
		"https://wa.me/971558711442?text=" + encodeURIComponent("مرحبا، أود الاستفسار عن أسعار الجملة");

	return (
		<section className="bg-brand-primary py-20 md:py-28">
			<Container>
				<div className="text-center">
					<motion.h2
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-4xl font-bold text-white md:text-5xl"
					>
						{t("cta.headline")}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.15, duration: 0.5 }}
						className="mt-4 text-lg text-white/80"
					>
						{t("cta.subtitle")}
					</motion.p>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 20 }}
						className="mt-8 inline-block"
					>
						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
							style={{ backgroundColor: "#25D366" }}
						>
							{/* WhatsApp icon */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover:scale-110"
								aria-hidden="true"
							>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
							</svg>
							{t("cta.button")}
							{/* Pulse ring */}
							<span
								className="absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
								style={{ boxShadow: "0 0 0 6px rgba(37,211,102,0.35)" }}
							/>
						</a>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.4 }}
						className="mt-5 text-sm text-white/60"
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
			<TargetsSection />
			<BenefitsSection />
			<StepsSection />
			<FaqSection />
			<CtaSection />
		</main>
	);
}
