"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

interface CategoryBottomSheetProps {
	categories: RootCategory[];
	isOpen: boolean;
	onClose: () => void;
}

function getName(item: { name: string; translation?: { name?: string | null } | null }) {
	return item.translation?.name || item.name;
}

export function CategoryBottomSheet({ categories, isOpen, onClose }: CategoryBottomSheetProps) {
	const t = useTranslations("bottomNav");
	const locale = useLocale();
	const isRtl = locale === "ar";
	const pathname = usePathname();
	const [selectedCategory, setSelectedCategory] = useState<RootCategory | null>(null);

	const ChevronBack = isRtl ? ChevronRight : ChevronLeft;

	// Auto-close when route changes
	useEffect(() => {
		onClose();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	// Reset category selection after sheet closes
	useEffect(() => {
		if (!isOpen) {
			const id = setTimeout(() => setSelectedCategory(null), 320);
			return () => clearTimeout(id);
		}
	}, [isOpen]);

	const closeSheet = useCallback(() => onClose(), [onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						key="cat-sheet-backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-[59] bg-black/40"
						onClick={closeSheet}
						aria-hidden="true"
					/>

					{/* Sheet */}
					<motion.div
						key="cat-sheet-panel"
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
						role="dialog"
						aria-modal="true"
						aria-label={t("categories")}
						className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[85vh] flex-col rounded-t-2xl bg-surface-base"
						style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
					>
						{/* Handle */}
						<div className="flex shrink-0 justify-center py-3">
							<div className="h-1 w-10 rounded-full bg-line-default" />
						</div>

						{/* Header */}
						<div className="flex shrink-0 items-center justify-between border-b border-line-subtle px-4 pb-3">
							{selectedCategory ? (
								<button
									onClick={() => setSelectedCategory(null)}
									className="flex items-center gap-1.5 text-sm font-medium text-content-secondary"
								>
									<ChevronBack className="h-4 w-4 shrink-0" />
									<span>{t("back")}</span>
								</button>
							) : (
								<span className="text-sm font-semibold text-content-primary">{t("categories")}</span>
							)}

							<button
								onClick={closeSheet}
								className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-raised"
								aria-label="Close"
							>
								<X className="h-5 w-5 text-content-secondary" />
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-4">
							{!selectedCategory ? (
								/* Root categories — 2-col grid */
								<div className="grid grid-cols-2 gap-3">
									{categories.map((cat) => {
										const hasChildren = (cat.children?.edges.length ?? 0) > 0;
										return hasChildren ? (
											<button
												key={cat.id}
												onClick={() => setSelectedCategory(cat)}
												className="rounded-xl border border-line-subtle bg-brand-primary/5 px-4 py-4 text-left text-sm font-medium text-content-primary hover:border-brand-primary hover:bg-brand-primary/10"
											>
												{getName(cat)}
											</button>
										) : (
											<LinkWithChannel
												key={cat.id}
												href={`/categories/${cat.slug}`}
												onClick={closeSheet}
												className="rounded-xl border border-line-subtle bg-brand-primary/5 px-4 py-4 text-sm font-medium text-content-primary hover:border-brand-primary hover:bg-brand-primary/10"
											>
												{getName(cat)}
											</LinkWithChannel>
										);
									})}
								</div>
							) : (
								/* Subcategories */
								<div>
									<div className="mb-4">
										<LinkWithChannel
											href={`/categories/${selectedCategory.slug}`}
											onClick={closeSheet}
											className="text-sm font-medium text-brand-primary"
										>
											{t("viewAll")} {getName(selectedCategory)} {isRtl ? "←" : "→"}
										</LinkWithChannel>
									</div>
									<div className="space-y-2">
										{selectedCategory.children?.edges.map(({ node }) => (
											<LinkWithChannel
												key={node.id}
												href={`/categories/${node.slug}`}
												onClick={closeSheet}
												className="block rounded-xl border border-line-subtle px-4 py-3 text-sm font-medium text-content-primary hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
											>
												{getName(node)}
											</LinkWithChannel>
										))}
									</div>
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
