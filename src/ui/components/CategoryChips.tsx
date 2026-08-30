"use client";

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

interface CategoryChipsProps {
	categories: RootCategory[];
	activeSlug?: string | null;
}

function getName(item: { name: string; translation?: { name?: string | null } | null }) {
	return item.translation?.name || item.name;
}

function findActiveRoot(categories: RootCategory[], activeSlug?: string | null): string | null {
	if (!activeSlug) return null;
	for (const cat of categories) {
		if (cat.slug === activeSlug) return cat.slug;
		if (cat.children?.edges.some(({ node }) => node.slug === activeSlug)) return cat.slug;
	}
	return null;
}

export function CategoryChips({ categories, activeSlug }: CategoryChipsProps) {
	const activeRoot = findActiveRoot(categories, activeSlug);

	if (categories.length === 0) return null;

	return (
		<div
			className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
			role="list"
			aria-label="Category navigation"
		>
			{categories.map((cat) => {
				const isActive = activeRoot === cat.slug;
				return (
					<LinkWithChannel
						key={cat.id}
						href={`/categories/${cat.slug}`}
						role="listitem"
						className={clsx(
							"shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
							isActive
								? "border-brand-primary bg-brand-primary text-content-inverse"
								: "border-line-subtle bg-surface-raised text-content-primary hover:border-brand-primary",
						)}
					>
						{getName(cat)}
					</LinkWithChannel>
				);
			})}
		</div>
	);
}
