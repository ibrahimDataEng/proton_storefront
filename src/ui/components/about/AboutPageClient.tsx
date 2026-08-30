"use client";

import { useRef, type ComponentType } from "react";
import { m, useInView } from "framer-motion";
import {
	Layers,
	TrendingUp,
	Gauge,
	Handshake,
	Leaf,
	Users,
	Heart,
	ShieldCheck,
	Star,
	Award,
	Compass,
	Target,
	type LucideProps,
} from "lucide-react";
import { Container } from "@/ui/components/Container";
import type { AboutItem, ParsedAboutContent } from "@/lib/parseAboutContent";

// ── Animation variants (mirrors WholesalePageClient.tsx) ────────────────────

const containerStagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
	hidden: { opacity: 0, y: 28 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, stiffness: 260, damping: 24 },
	},
};

// ── Icon selection ───────────────────────────────────────────────────────────
// Content is CMS-driven (EN/AR), so icons are assigned positionally by
// default — a best-effort keyword match is layered on top for English titles.

type IconType = ComponentType<LucideProps>;

const OBJECTIVE_ICONS: IconType[] = [Layers, TrendingUp, Gauge, Handshake, Leaf, Users];
const VALUE_ICONS: IconType[] = [Heart, ShieldCheck, Star, Award, Compass, Target];

const OBJECTIVE_KEYWORDS: [RegExp, IconType][] = [
	[/diversif/i, Layers],
	[/expan/i, TrendingUp],
	[/operational|efficien|excellence/i, Gauge],
	[/partner/i, Handshake],
	[/sustainab|environ/i, Leaf],
	[/customer|client/i, Users],
];

const VALUE_KEYWORDS: [RegExp, IconType][] = [
	[/integrity|honest|trust/i, ShieldCheck],
	[/quality|excellence/i, Award],
	[/respect|people/i, Heart],
	[/innovat/i, Star],
	[/reliab|commit/i, Compass],
	[/team|collabor/i, Target],
];

function pickIcon(
	title: string,
	index: number,
	keywords: [RegExp, IconType][],
	fallback: IconType[],
): IconType {
	const match = keywords.find(([pattern]) => pattern.test(title));
	return match ? match[1] : fallback[index % fallback.length];
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────

function HeroSection({ title, paragraphs }: { title: string; paragraphs: string[] }) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true });

	return (
		<section ref={ref} className="relative overflow-hidden bg-brand-primary py-24 md:py-32">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: "radial-gradient(ellipse at 50% -5%, rgba(255,255,255,0.09) 0%, transparent 62%)",
				}}
				aria-hidden="true"
			/>

			<Container className="relative z-10">
				<m.div
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="mx-auto max-w-3xl text-center"
				>
					<m.h1
						variants={fadeUp}
						className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
					>
						{title}
					</m.h1>

					{paragraphs.map((paragraph, i) => (
						<m.p
							key={i}
							variants={fadeUp}
							className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl"
						>
							{paragraph}
						</m.p>
					))}
				</m.div>
			</Container>
		</section>
	);
}

// ── Section 2: Mission (prose, not cards) ────────────────────────────────────

function MissionSection({ title, paragraphs }: { title: string; paragraphs: string[] }) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.2 });

	return (
		<section className="py-16 md:py-24">
			<Container>
				<m.div
					ref={ref}
					variants={containerStagger}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="mx-auto max-w-2xl text-center"
				>
					<m.h2 variants={fadeUp} className="text-3xl font-bold text-content-primary md:text-4xl">
						{title}
					</m.h2>
					<div className="mx-auto mt-5 flex flex-col gap-4">
						{paragraphs.map((paragraph, i) => (
							<m.p
								key={i}
								variants={fadeUp}
								className="text-base leading-relaxed text-content-secondary md:text-lg"
							>
								{paragraph}
							</m.p>
						))}
					</div>
				</m.div>
			</Container>
		</section>
	);
}

// ── Shared: card grid section (Objectives / Values) ──────────────────────────

interface CardGridSectionProps {
	title: string;
	intro?: string;
	items: AboutItem[];
	getIcon: (title: string, index: number) => IconType;
	surfaceClassName: string;
	iconWrapClassName: string;
}

function CardGridSection({
	title,
	intro,
	items,
	getIcon,
	surfaceClassName,
	iconWrapClassName,
}: CardGridSectionProps) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, amount: 0.1 });

	return (
		<section className={surfaceClassName}>
			<Container>
				<m.div ref={ref} variants={containerStagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
					<m.div variants={fadeUp} className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-content-primary md:text-4xl">{title}</h2>
						{intro && <p className="mx-auto mt-3 max-w-2xl text-content-secondary">{intro}</p>}
					</m.div>

					<div className="grid grid-cols-2 gap-5 md:grid-cols-3">
						{items.map((item, i) => {
							const Icon = getIcon(item.title, i);
							return (
								<m.div
									key={i}
									variants={fadeUp}
									whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
									className="group relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-base p-5 shadow-soft transition-shadow hover:border-brand-primary/40 hover:shadow-raised md:p-6"
								>
									<div
										className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClassName}`}
									>
										<Icon className="h-5 w-5" aria-hidden="true" />
									</div>
									<h3 className="mt-4 text-base font-semibold text-content-primary md:text-lg">
										{item.title}
									</h3>
									<p className="mt-1.5 text-sm leading-relaxed text-content-secondary">{item.description}</p>
								</m.div>
							);
						})}
					</div>
				</m.div>
			</Container>
		</section>
	);
}

function ObjectivesSection({ title, intro, items }: { title: string; intro?: string; items: AboutItem[] }) {
	return (
		<CardGridSection
			title={title}
			intro={intro}
			items={items}
			getIcon={(itemTitle, i) => pickIcon(itemTitle, i, OBJECTIVE_KEYWORDS, OBJECTIVE_ICONS)}
			surfaceClassName="bg-surface-raised py-16 md:py-24"
			iconWrapClassName="bg-brand-primary/10 text-brand-primary"
		/>
	);
}

function ValuesSection({ title, items }: { title: string; items: AboutItem[] }) {
	return (
		<CardGridSection
			title={title}
			items={items}
			getIcon={(itemTitle, i) => pickIcon(itemTitle, i, VALUE_KEYWORDS, VALUE_ICONS)}
			surfaceClassName="py-16 md:py-24"
			iconWrapClassName="bg-brand-accent/20 text-brand-muted"
		/>
	);
}

// ── Root export ───────────────────────────────────────────────────────────────

export function AboutPageClient({ data }: { data: ParsedAboutContent }) {
	return (
		<main>
			<HeroSection title={data.about.title} paragraphs={data.about.paragraphs} />
			<MissionSection title={data.mission.title} paragraphs={data.mission.paragraphs} />
			<ObjectivesSection
				title={data.objectives.title}
				intro={data.objectives.intro}
				items={data.objectives.items}
			/>
			<ValuesSection title={data.values.title} items={data.values.items} />
		</main>
	);
}
