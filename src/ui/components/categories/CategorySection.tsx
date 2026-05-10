"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import clsx from "clsx";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type ChildCategory = {
	id: string;
	name: string;
	slug: string;
	translation?: { name?: string | null } | null;
};

type RootCategory = {
	id: string;
	name: string;
	slug: string;
	translation?: { name?: string | null } | null;
	children?: { edges: Array<{ node: ChildCategory }> } | null;
};

const CARD_COLORS = [
	"bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
	"bg-amber-50 hover:bg-amber-100 border-amber-100",
	"bg-sky-50 hover:bg-sky-100 border-sky-100",
	"bg-rose-50 hover:bg-rose-100 border-rose-100",
	"bg-violet-50 hover:bg-violet-100 border-violet-100",
	"bg-orange-50 hover:bg-orange-100 border-orange-100",
	"bg-teal-50 hover:bg-teal-100 border-teal-100",
	"bg-pink-50 hover:bg-pink-100 border-pink-100",
];

function getName(item: { name: string; translation?: { name?: string | null } | null }) {
	return item.translation?.name || item.name;
}

interface CategorySectionProps {
	category: RootCategory;
	colorIndex: number;
}

export function CategorySection({ category, colorIndex }: CategorySectionProps) {
	const ref = useRef<HTMLElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-40px" });
	const locale = useLocale();
	const isRtl = locale === "ar";

	const children = category.children?.edges ?? [];
	const cardColor = CARD_COLORS[colorIndex % CARD_COLORS.length];

	return (
		<section ref={ref}>
			{/* Section header */}
			<div className="mb-4 flex items-center justify-between">
				<LinkWithChannel
					href={`/categories/${category.slug}`}
					className="group flex items-center gap-1.5 text-lg font-semibold text-content-primary hover:text-brand-primary"
				>
					{getName(category)}
					<ArrowRight
						className={clsx(
							"h-4 w-4 text-brand-primary transition-transform group-hover:translate-x-1",
							isRtl && "rotate-180",
						)}
						aria-hidden
					/>
				</LinkWithChannel>
			</div>

			{/* Subcategory cards — horizontal scroll on mobile, 4-col grid on md+ */}
			<div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0">
				{children.map(({ node }, i) => (
					<motion.div
						key={node.id}
						initial={{ opacity: 0, y: 14 }}
						animate={isInView ? { opacity: 1, y: 0 } : {}}
						transition={{ duration: 0.25, delay: i * 0.04 }}
						className="w-36 shrink-0 md:w-auto"
					>
						<LinkWithChannel
							href={`/categories/${node.slug}`}
							className={clsx(
								"flex h-20 w-full items-center justify-center rounded-xl border px-3 text-center text-sm font-medium text-content-primary transition-all md:h-24",
								cardColor,
							)}
						>
							{getName(node)}
						</LinkWithChannel>
					</motion.div>
				))}

				{/* No children — show the root category itself */}
				{children.length === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={isInView ? { opacity: 1, y: 0 } : {}}
						transition={{ duration: 0.25 }}
						className="w-36 shrink-0 md:col-span-2 md:w-auto"
					>
						<LinkWithChannel
							href={`/categories/${category.slug}`}
							className={clsx(
								"flex h-20 w-full items-center justify-center rounded-xl border px-3 text-center text-sm font-medium text-content-primary transition-all md:h-24",
								cardColor,
							)}
						>
							{getName(category)}
						</LinkWithChannel>
					</motion.div>
				)}
			</div>
		</section>
	);
}
