"use client";

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

interface CategorySidebarProps {
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

export function CategorySidebar({ categories, activeSlug }: CategorySidebarProps) {
	const locale = useLocale();
	const activeRoot = findActiveRoot(categories, activeSlug);

	return (
		<>
			{/* ── Mobile: fixed sidebar on the right (thumb-reach) ── */}
			<aside
				className="fixed right-0 z-40 flex w-16 flex-col overflow-y-auto border-l border-line-subtle bg-surface-base md:hidden"
				style={{
					top: "calc(64px + var(--topbar-height, 0px))",
					bottom: "64px",
				}}
				aria-label="Category navigation"
			>
				{categories.map((cat) => {
					const isActive = activeRoot === cat.slug;
					const initial = getName(cat).charAt(0).toUpperCase();
					return (
						<LinkWithChannel
							key={cat.id}
							href={`/categories/${cat.slug}`}
							className={clsx(
								"flex flex-col items-center justify-center gap-1 border-b border-line-subtle px-1 py-3 text-center transition-colors",
								isActive
									? "bg-brand-primary/10 text-brand-primary"
									: "text-content-secondary hover:bg-surface-raised hover:text-content-primary",
							)}
						>
							<div
								className={clsx(
									"flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
									isActive ? "bg-brand-primary/20 text-brand-primary" : "bg-surface-sunken",
								)}
							>
								{initial}
							</div>
							<span className="line-clamp-2 w-full text-[9px] leading-tight">{getName(cat)}</span>
						</LinkWithChannel>
					);
				})}
			</aside>

			{/* ── Desktop: sticky left sidebar in the flex row ── */}
			<div
				className="hidden w-56 shrink-0 overflow-y-auto border-r border-line-subtle md:block"
				style={{
					position: "sticky",
					top: "calc(64px + var(--topbar-height, 0px))",
					maxHeight: "calc(100vh - 64px - var(--topbar-height, 0px))",
					alignSelf: "flex-start",
				}}
				aria-label="Category navigation"
			>
				<nav className="py-4" dir={locale === "ar" ? "rtl" : "ltr"}>
					{categories.map((cat) => {
						const isActiveRoot = activeRoot === cat.slug;
						const hasActiveSub =
							!!activeSlug && cat.children?.edges.some(({ node }) => node.slug === activeSlug);
						const expanded = isActiveRoot || hasActiveSub;
						const children = cat.children?.edges ?? [];

						return (
							<div key={cat.id}>
								<LinkWithChannel
									href={`/categories/${cat.slug}`}
									className={clsx(
										"flex items-center px-4 py-2.5 text-sm font-medium transition-colors",
										isActiveRoot
											? "border-l-2 border-brand-primary bg-brand-primary/10 text-brand-primary"
											: "text-content-primary hover:bg-surface-raised hover:text-brand-primary",
									)}
								>
									{getName(cat)}
								</LinkWithChannel>

								{expanded && children.length > 0 && (
									<div className="pb-1">
										{children.map(({ node }) => (
											<LinkWithChannel
												key={node.id}
												href={`/categories/${node.slug}`}
												className={clsx(
													"block py-1.5 pl-8 pr-4 text-xs transition-colors",
													activeSlug === node.slug
														? "font-semibold text-brand-primary"
														: "text-content-secondary hover:text-brand-primary",
												)}
											>
												{getName(node)}
											</LinkWithChannel>
										))}
									</div>
								)}
							</div>
						);
					})}
				</nav>
			</div>
		</>
	);
}
