"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useClickOutside } from "@/ui/hooks/useClickOutside";

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
	children?: {
		edges: Array<{ node: ChildCategory }>;
	} | null;
};

interface ShopNavItemProps {
	categories: RootCategory[];
	mobile?: boolean;
}

function getName(item: { name: string; translation?: { name?: string | null } | null }) {
	return item.translation?.name || item.name;
}

export function ShopNavItem({ categories, mobile = false }: ShopNavItemProps) {
	const locale = useLocale();
	const t = useTranslations("nav");
	const isRtl = locale === "ar";

	const [desktopOpen, setDesktopOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState<RootCategory | null>(categories[0] ?? null);
	const [mobileExpanded, setMobileExpanded] = useState(false);
	const [mobileActiveCategory, setMobileActiveCategory] = useState<string | null>(null);

	const containerRef = useRef<HTMLLIElement>(null);

	useClickOutside(containerRef as React.RefObject<HTMLLIElement>, () => setDesktopOpen(false), desktopOpen);

	if (mobile) {
		// Accordion inside the existing MobileMenu dialog
		return (
			<li>
				<button
					className="flex w-full items-center justify-between py-1 text-sm font-medium text-content-secondary"
					onClick={() => setMobileExpanded((v) => !v)}
					aria-expanded={mobileExpanded}
				>
					<span>{t("shop")}</span>
					<ChevronDown
						className={clsx("h-4 w-4 transition-transform duration-200", mobileExpanded && "rotate-180")}
					/>
				</button>

				<AnimatePresence initial={false}>
					{mobileExpanded && (
						<motion.div
							key="mobile-categories"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="overflow-hidden"
						>
							<ul className="mt-2 space-y-1 border-l-2 border-brand-primary/20 pl-4">
								{categories.map((cat) => {
									const children = cat.children?.edges ?? [];
									const hasChildren = children.length > 0;
									const expanded = mobileActiveCategory === cat.id;

									return (
										<li key={cat.id}>
											<div className="flex items-center justify-between">
												<LinkWithChannel
													href={`/categories/${cat.slug}`}
													className="flex-1 py-1.5 text-sm text-content-secondary hover:text-content-primary"
												>
													{getName(cat)}
												</LinkWithChannel>
												{hasChildren && (
													<button
														onClick={() => setMobileActiveCategory(expanded ? null : cat.id)}
														className="p-1 text-content-secondary"
														aria-label={expanded ? "Collapse" : "Expand"}
													>
														<ChevronDown
															className={clsx(
																"h-3.5 w-3.5 transition-transform duration-200",
																expanded && "rotate-180",
															)}
														/>
													</button>
												)}
											</div>

											<AnimatePresence initial={false}>
												{expanded && hasChildren && (
													<motion.ul
														key={`sub-${cat.id}`}
														initial={{ height: 0, opacity: 0 }}
														animate={{ height: "auto", opacity: 1 }}
														exit={{ height: 0, opacity: 0 }}
														transition={{ duration: 0.2 }}
														className="overflow-hidden pl-3"
													>
														{children.map(({ node }) => (
															<li key={node.id}>
																<LinkWithChannel
																	href={`/categories/${node.slug}`}
																	className="block py-1.5 text-xs text-content-secondary hover:text-brand-primary"
																>
																	{getName(node)}
																</LinkWithChannel>
															</li>
														))}
													</motion.ul>
												)}
											</AnimatePresence>
										</li>
									);
								})}

								<li>
									<LinkWithChannel
										href="/products"
										className="block py-1.5 text-sm font-medium text-brand-primary hover:underline"
									>
										{t("viewAll")} {isRtl ? "←" : "→"}
									</LinkWithChannel>
								</li>
							</ul>
						</motion.div>
					)}
				</AnimatePresence>
			</li>
		);
	}

	// Desktop: hover-triggered mega menu panel
	return (
		<li
			ref={containerRef}
			className="relative inline-flex"
			onMouseEnter={() => setDesktopOpen(true)}
			onMouseLeave={() => setDesktopOpen(false)}
		>
			<LinkWithChannel
				href="/products"
				className={clsx(
					"inline-flex items-center gap-1 border-b-2 pt-px text-sm font-medium transition-colors",
					desktopOpen
						? "border-brand-primary text-brand-primary"
						: "border-transparent text-content-secondary hover:text-content-primary",
				)}
				aria-haspopup="true"
				aria-expanded={desktopOpen}
			>
				{t("shop")}
				<ChevronDown
					className={clsx("h-3.5 w-3.5 transition-transform duration-200", desktopOpen && "rotate-180")}
				/>
			</LinkWithChannel>

			<AnimatePresence>
				{desktopOpen && (
					<motion.div
						initial={{ opacity: 0, scaleY: 0.95 }}
						animate={{ opacity: 1, scaleY: 1 }}
						exit={{ opacity: 0, scaleY: 0.95 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						style={{
							top: "calc(var(--topbar-height, 0px) + 64px)",
							transformOrigin: "top",
						}}
						className="fixed left-0 right-0 z-40 max-h-[420px] overflow-hidden rounded-b-2xl border-t border-line-subtle bg-surface-base shadow-xl"
						role="region"
						aria-label={t("shop")}
					>
						<div className="mx-auto flex max-w-7xl">
							{/* Left column — root category list */}
							<div
								className={clsx(
									"w-52 shrink-0 py-4",
									isRtl ? "border-l border-line-subtle" : "border-r border-line-subtle",
								)}
							>
								{categories.map((cat) => (
									<button
										key={cat.id}
										className={clsx(
											"flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors",
											isRtl ? "border-r-2 text-right" : "border-l-2 text-left",
											activeCategory?.id === cat.id
												? isRtl
													? "border-brand-primary bg-brand-primary/5 font-medium text-brand-primary"
													: "border-brand-primary bg-brand-primary/5 font-medium text-brand-primary"
												: isRtl
													? "border-transparent text-content-secondary hover:bg-surface-raised hover:text-content-primary"
													: "border-transparent text-content-secondary hover:bg-surface-raised hover:text-content-primary",
										)}
										onMouseEnter={() => setActiveCategory(cat)}
									>
										{getName(cat)}
										{isRtl ? (
											<ChevronLeft className="h-3.5 w-3.5 shrink-0" />
										) : (
											<ChevronRight className="h-3.5 w-3.5 shrink-0" />
										)}
									</button>
								))}
							</div>

							{/* Right panel — subcategories grid */}
							<div className="flex flex-1 flex-col justify-between overflow-hidden px-6 py-4">
								{activeCategory && (
									<div>
										<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-content-secondary">
											{getName(activeCategory)}
										</p>

										<AnimatePresence mode="wait">
											<motion.div
												key={activeCategory.id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.15 }}
												className="grid grid-cols-3 gap-2 xl:grid-cols-4"
											>
												{activeCategory.children?.edges.map(({ node }, i) => (
													<motion.div
														key={node.id}
														initial={{ opacity: 0, y: 6 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ delay: i * 0.05, duration: 0.2 }}
													>
														<LinkWithChannel
															href={`/categories/${node.slug}`}
															onClick={() => setDesktopOpen(false)}
															className="block rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-brand-primary hover:text-white"
														>
															{getName(node)}
														</LinkWithChannel>
													</motion.div>
												))}

												{/* Fallback: link to parent category if no children */}
												{(!activeCategory.children || activeCategory.children.edges.length === 0) && (
													<motion.div
														initial={{ opacity: 0, y: 6 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ duration: 0.2 }}
													>
														<LinkWithChannel
															href={`/categories/${activeCategory.slug}`}
															onClick={() => setDesktopOpen(false)}
															className="block rounded-lg px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-brand-primary hover:text-white"
														>
															{t("allCategories")}
														</LinkWithChannel>
													</motion.div>
												)}
											</motion.div>
										</AnimatePresence>
									</div>
								)}

								{/* Bottom "View all" link */}
								<LinkWithChannel
									href="/products"
									onClick={() => setDesktopOpen(false)}
									className={clsx(
										"mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline",
										isRtl && "flex-row-reverse",
									)}
								>
									{t("viewAll")}
									{isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
								</LinkWithChannel>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</li>
	);
}
