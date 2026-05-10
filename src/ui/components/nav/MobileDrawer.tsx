"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname as useNextPathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MenuIcon, ShoppingBagIcon, UserIcon, X } from "lucide-react";
import clsx from "clsx";
import { Link, usePathname as useIntlPathname } from "@/i18n/navigation";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { Logo } from "@/ui/components/Logo";
import { useAuth } from "@/ui/context/AuthContext";

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

interface MobileDrawerProps {
	categories: RootCategory[];
}

type Level = 0 | 1 | 2;

function getName(item: { name: string; translation?: { name?: string | null } | null }) {
	return item.translation?.name || item.name;
}

// Slide variants — direction 1=forward, -1=back; RTL reverses axis
const slideVariants = {
	enter: (c: { direction: number; isRtl: boolean }) => ({
		x: `${c.direction * (c.isRtl ? -1 : 1) * 100}%`,
		opacity: 0,
	}),
	center: { x: 0, opacity: 1 },
	exit: (c: { direction: number; isRtl: boolean }) => ({
		x: `${c.direction * (c.isRtl ? 1 : -1) * 100}%`,
		opacity: 0,
	}),
};

const levelTransition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export function MobileDrawer({ categories }: MobileDrawerProps) {
	const locale = useLocale();
	const tNav = useTranslations("nav");
	const tAuth = useTranslations("auth");
	const isRtl = locale === "ar";

	const nextPathname = useNextPathname();
	const intlPathname = useIntlPathname();
	const { isLoggedIn, openAuthModal } = useAuth();

	const [isOpen, setIsOpen] = useState(false);
	const [level, setLevel] = useState<Level>(0);
	const [selectedCategory, setSelectedCategory] = useState<RootCategory | null>(null);
	const [direction, setDirection] = useState<1 | -1>(1);

	// Auto-close when route changes (browser back, link clicks, etc.)
	useEffect(() => {
		setIsOpen(false);
	}, [nextPathname]);

	// Reset levels after drawer closes
	useEffect(() => {
		if (!isOpen) {
			const id = setTimeout(() => {
				setLevel(0);
				setSelectedCategory(null);
				setDirection(1);
			}, 320);
			return () => clearTimeout(id);
		}
	}, [isOpen]);

	const openDrawer = useCallback(() => setIsOpen(true), []);
	const closeDrawer = useCallback(() => setIsOpen(false), []);

	const goTo = useCallback(
		(newLevel: Level, cat?: RootCategory) => {
			setDirection(newLevel > level ? 1 : -1);
			setLevel(newLevel);
			if (cat !== undefined) setSelectedCategory(cat);
		},
		[level],
	);

	const goBack = useCallback(() => {
		if (level === 2) goTo(1);
		else if (level === 1) goTo(0);
	}, [level, goTo]);

	// Unique key per level panel so AnimatePresence detects changes
	const levelKey = level === 2 && selectedCategory ? `level-2-${selectedCategory.id}` : `level-${level}`;

	const custom = { direction, isRtl };

	// Shared row class for level items
	const rowCls = "flex w-full items-center justify-between py-4 text-base font-medium text-content-primary";
	const ChevronForward = isRtl ? ChevronLeft : ChevronRight;
	const ChevronBack = isRtl ? ChevronRight : ChevronLeft;

	return (
		<>
			{/* Hamburger trigger — mobile only */}
			<button
				className="flex h-8 w-8 items-center justify-center self-center md:hidden"
				onClick={openDrawer}
				aria-label="Open menu"
				aria-expanded={isOpen}
				aria-controls="mobile-drawer"
			>
				<MenuIcon className="h-6 w-6 shrink-0" aria-hidden />
			</button>

			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							key="mobile-drawer-backdrop"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-[59] bg-black/40"
							onClick={closeDrawer}
							aria-hidden="true"
						/>

						{/* Drawer panel — slides in from right (LTR) / left (RTL) */}
						<motion.div
							key="mobile-drawer-panel"
							id="mobile-drawer"
							role="dialog"
							aria-modal="true"
							aria-label="Navigation menu"
							initial={{ x: isRtl ? "-100%" : "100%" }}
							animate={{ x: 0 }}
							exit={{ x: isRtl ? "-100%" : "100%" }}
							transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
							className="fixed inset-0 z-[60] flex flex-col bg-surface-base"
						>
							{/* ── Header row ── */}
							<div className="flex h-16 shrink-0 items-center justify-between border-b border-line-subtle px-4">
								{level === 0 ? (
									<Logo />
								) : (
									<button
										onClick={goBack}
										className="flex items-center gap-2 text-sm font-medium text-content-secondary"
									>
										<ChevronBack className="h-4 w-4 shrink-0" />
										<span>
											{level === 1
												? tNav("shop")
												: selectedCategory
													? getName(selectedCategory)
													: tNav("shop")}
										</span>
									</button>
								)}

								<button
									onClick={closeDrawer}
									className="flex h-8 w-8 items-center justify-center rounded-full text-content-secondary hover:bg-surface-raised"
									aria-label="Close menu"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{/* ── Level content — animated slides ── */}
							<div className="relative flex-1 overflow-hidden">
								<AnimatePresence mode="wait" custom={custom}>
									<motion.div
										key={levelKey}
										custom={custom}
										variants={slideVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={levelTransition}
										className="absolute inset-0 overflow-y-auto"
									>
										{/* ── Level 0: Main nav ── */}
										{level === 0 && (
											<ul className="divide-y divide-line-subtle px-4 py-2">
												<li>
													<LinkWithChannel href="/" onClick={closeDrawer} className={rowCls}>
														{tNav("home")}
													</LinkWithChannel>
												</li>
												<li>
													<button
														onClick={() => goTo(1)}
														className={clsx(rowCls, isRtl ? "text-right" : "text-left")}
													>
														<span>{tNav("shop")}</span>
														<ChevronForward className="h-5 w-5 text-content-secondary" />
													</button>
												</li>
												<li>
													<LinkWithChannel href="/pages/wholesale" onClick={closeDrawer} className={rowCls}>
														{tNav("wholesale")}
													</LinkWithChannel>
												</li>
												<li>
													<LinkWithChannel href="/pages/contact-us" onClick={closeDrawer} className={rowCls}>
														{tNav("contact")}
													</LinkWithChannel>
												</li>
											</ul>
										)}

										{/* ── Level 1: Root categories ── */}
										{level === 1 && (
											<div>
												<ul className="divide-y divide-line-subtle px-4 py-2">
													{categories.map((cat) => {
														const hasChildren = (cat.children?.edges.length ?? 0) > 0;
														return (
															<li key={cat.id}>
																{hasChildren ? (
																	<button
																		onClick={() => goTo(2, cat)}
																		className={clsx(rowCls, isRtl ? "text-right" : "text-left")}
																	>
																		<span>{getName(cat)}</span>
																		<ChevronForward className="h-5 w-5 text-content-secondary" />
																	</button>
																) : (
																	<LinkWithChannel
																		href={`/categories/${cat.slug}`}
																		onClick={closeDrawer}
																		className={rowCls}
																	>
																		{getName(cat)}
																	</LinkWithChannel>
																)}
															</li>
														);
													})}
												</ul>

												<div className="border-t border-line-subtle px-4 py-4">
													<LinkWithChannel
														href="/products"
														onClick={closeDrawer}
														className="text-sm font-medium text-brand-primary"
													>
														{tNav("viewAll")} {isRtl ? "←" : "→"}
													</LinkWithChannel>
												</div>
											</div>
										)}

										{/* ── Level 2: Subcategories ── */}
										{level === 2 && selectedCategory && (
											<div>
												<div className="grid grid-cols-2 gap-3 p-4">
													{selectedCategory.children?.edges.map(({ node }) => (
														<LinkWithChannel
															key={node.id}
															href={`/categories/${node.slug}`}
															onClick={closeDrawer}
															className="rounded-xl border border-line-subtle px-4 py-3 text-sm font-medium text-content-primary hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
														>
															{getName(node)}
														</LinkWithChannel>
													))}
												</div>

												<div className="border-t border-line-subtle px-4 py-4">
													<LinkWithChannel
														href={`/categories/${selectedCategory.slug}`}
														onClick={closeDrawer}
														className="text-sm font-medium text-brand-primary"
													>
														{tNav("viewAll")} {getName(selectedCategory)} {isRtl ? "←" : "→"}
													</LinkWithChannel>
												</div>
											</div>
										)}
									</motion.div>
								</AnimatePresence>
							</div>

							{/* ── Bottom bar: lang + cart + account ── */}
							<div className="shrink-0 border-t border-line-subtle px-4 pb-6 pt-4">
								<div className="flex items-center justify-between">
									{/* Language switcher */}
									<div className="flex items-center gap-3">
										<Link
											href={intlPathname}
											locale="en"
											className={clsx(
												"text-sm transition-colors",
												locale === "en"
													? "font-semibold text-brand-primary underline"
													: "text-content-secondary hover:text-content-primary",
											)}
											onClick={closeDrawer}
										>
											EN
										</Link>
										<span className="text-content-secondary">|</span>
										<Link
											href={intlPathname}
											locale="ar"
											className={clsx(
												"text-sm transition-colors",
												locale === "ar"
													? "font-semibold text-brand-primary underline"
													: "text-content-secondary hover:text-content-primary",
											)}
											onClick={closeDrawer}
										>
											AR
										</Link>
									</div>

									{/* Cart + Account icons */}
									<div className="flex items-center gap-4">
										<LinkWithChannel href="/cart" onClick={closeDrawer} aria-label="Cart">
											<ShoppingBagIcon className="h-5 w-5 text-content-secondary" />
										</LinkWithChannel>

										{isLoggedIn ? (
											<LinkWithChannel href="/account" onClick={closeDrawer} aria-label={tAuth("myAccount")}>
												<UserIcon className="h-5 w-5 text-content-secondary" />
											</LinkWithChannel>
										) : (
											<button
												aria-label={tAuth("login")}
												onClick={() => {
													openAuthModal("login");
													closeDrawer();
												}}
											>
												<UserIcon className="h-5 w-5 text-content-secondary" />
											</button>
										)}
									</div>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
