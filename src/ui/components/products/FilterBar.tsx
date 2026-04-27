"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";
import { useClickOutside } from "@/ui/hooks/useClickOutside";

export interface FilterCategory {
	id: string;
	slug: string;
	name: string;
}

interface FilterBarProps {
	totalCount: number;
	categories: FilterCategory[];
}

type OpenDropdown = "sort" | "category" | "price" | null;

const PRICE_PRESETS = [
	{ label: "Under 50", min: "", max: "50" },
	{ label: "50–100", min: "50", max: "100" },
	{ label: "100–200", min: "100", max: "200" },
	{ label: "200+", min: "200", max: "" },
];

export function FilterBar({ totalCount, categories }: FilterBarProps) {
	const t = useTranslations("products");
	const router = useRouter();
	const searchParams = useSearchParams();

	const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [localMinPrice, setLocalMinPrice] = useState(searchParams.get("minPrice") ?? "");
	const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

	const containerRef = useRef<HTMLDivElement>(null);
	const closeDropdown = useCallback(() => setOpenDropdown(null), []);
	useClickOutside(containerRef, closeDropdown, openDropdown !== null);

	const currentSort = searchParams.get("sortBy") ?? "DATE";
	const currentCategory = searchParams.get("category") ?? "";
	const currentMinPrice = searchParams.get("minPrice") ?? "";
	const currentMaxPrice = searchParams.get("maxPrice") ?? "";
	const currentInStock = searchParams.get("inStock") === "true";

	const hasActiveFilters =
		!!currentCategory ||
		!!currentMinPrice ||
		!!currentMaxPrice ||
		currentInStock ||
		(currentSort !== "DATE" && currentSort !== "");

	const sortOptions = [
		{ value: "DATE", label: t("newest") },
		{ value: "PRICE_ASC", label: t("priceLowHigh") },
		{ value: "PRICE_DESC", label: t("priceHighLow") },
		{ value: "BEST_SELLING", label: t("bestSelling") },
		{ value: "BIGGEST_SAVING", label: t("biggestDiscount") },
	];

	const currentSortLabel = sortOptions.find((o) => o.value === currentSort)?.label ?? t("newest");
	const currentCategoryName = categories.find((c) => c.slug === currentCategory)?.name ?? t("allCategories");

	const updateParam = useCallback(
		(key: string, value: string | null) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value !== null && value !== "") {
				params.set(key, value);
			} else {
				params.delete(key);
			}
			params.delete("cursor");
			router.push(`?${params.toString()}`);
		},
		[router, searchParams],
	);

	const clearAllFilters = useCallback(() => {
		router.push("?");
		setMobileOpen(false);
	}, [router]);

	const applyPrice = useCallback(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (localMinPrice) params.set("minPrice", localMinPrice);
		else params.delete("minPrice");
		if (localMaxPrice) params.set("maxPrice", localMaxPrice);
		else params.delete("maxPrice");
		params.delete("cursor");
		router.push(`?${params.toString()}`);
		setOpenDropdown(null);
	}, [localMinPrice, localMaxPrice, router, searchParams]);

	const openPrice = () => {
		setLocalMinPrice(currentMinPrice);
		setLocalMaxPrice(currentMaxPrice);
		setOpenDropdown(openDropdown === "price" ? null : "price");
	};

	return (
		<div className="mb-6">
			{/* ── Desktop bar ─────────────────────────────────────────── */}
			<div ref={containerRef} className="hidden items-center justify-between gap-4 sm:flex">
				<p className="shrink-0 text-sm text-content-secondary">{t("count", { count: totalCount })}</p>

				<div className="flex flex-wrap items-center gap-2">
					{/* Sort */}
					<div className="relative">
						<button
							type="button"
							onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
							className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-primary transition-colors hover:border-brand-primary"
						>
							{currentSort !== "DATE" && currentSort !== "" && (
								<span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
							)}
							{t("sortBy")}: {currentSortLabel}
							<ChevronDown size={14} aria-hidden="true" />
						</button>
						{openDropdown === "sort" && (
							<div className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-xl bg-surface-raised p-2 shadow-elevated">
								{sortOptions.map((opt) => (
									<button
										key={opt.value}
										type="button"
										className={clsx(
											"block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-sunken",
											currentSort === opt.value ? "font-semibold text-brand-primary" : "text-content-primary",
										)}
										onClick={() => {
											updateParam("sortBy", opt.value === "DATE" ? null : opt.value);
											setOpenDropdown(null);
										}}
									>
										{opt.label}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Category */}
					{categories.length > 0 && (
						<div className="relative">
							<button
								type="button"
								onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
								className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-primary transition-colors hover:border-brand-primary"
							>
								{currentCategory && (
									<span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
								)}
								{currentCategoryName}
								<ChevronDown size={14} aria-hidden="true" />
							</button>
							{openDropdown === "category" && (
								<div className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-xl bg-surface-raised p-2 shadow-elevated">
									<button
										type="button"
										className={clsx(
											"block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-sunken",
											!currentCategory ? "font-semibold text-brand-primary" : "text-content-primary",
										)}
										onClick={() => {
											updateParam("category", null);
											setOpenDropdown(null);
										}}
									>
										{t("allCategories")}
									</button>
									{categories.map((cat) => (
										<button
											key={cat.id}
											type="button"
											className={clsx(
												"block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-sunken",
												currentCategory === cat.slug
													? "font-semibold text-brand-primary"
													: "text-content-primary",
											)}
											onClick={() => {
												updateParam("category", cat.slug);
												setOpenDropdown(null);
											}}
										>
											{cat.name}
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{/* Price range */}
					<div className="relative">
						<button
							type="button"
							onClick={openPrice}
							className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-primary transition-colors hover:border-brand-primary"
						>
							{(currentMinPrice || currentMaxPrice) && (
								<span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
							)}
							{t("priceRange")}
							<ChevronDown size={14} aria-hidden="true" />
						</button>
						{openDropdown === "price" && (
							<div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl bg-surface-raised p-4 shadow-elevated">
								<div className="mb-3 flex flex-wrap gap-1">
									{PRICE_PRESETS.map((preset) => (
										<button
											key={preset.label}
											type="button"
											className="rounded-full bg-surface-sunken px-2 py-1 text-xs text-content-secondary transition-colors hover:bg-brand-primary hover:text-content-inverse"
											onClick={() => {
												setLocalMinPrice(preset.min);
												setLocalMaxPrice(preset.max);
											}}
										>
											{preset.label}
										</button>
									))}
								</div>
								<div className="flex items-center gap-2">
									<input
										type="number"
										placeholder={t("minPrice")}
										value={localMinPrice}
										onChange={(e) => setLocalMinPrice(e.target.value)}
										className="w-full rounded-lg border border-line-subtle bg-surface-base px-2 py-1.5 text-sm text-content-primary focus:border-brand-primary focus:outline-none"
									/>
									<span className="text-content-secondary">–</span>
									<input
										type="number"
										placeholder={t("maxPrice")}
										value={localMaxPrice}
										onChange={(e) => setLocalMaxPrice(e.target.value)}
										className="w-full rounded-lg border border-line-subtle bg-surface-base px-2 py-1.5 text-sm text-content-primary focus:border-brand-primary focus:outline-none"
									/>
								</div>
								<button
									type="button"
									onClick={applyPrice}
									className="mt-3 w-full rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
								>
									{t("apply")}
								</button>
							</div>
						)}
					</div>

					{/* In stock */}
					<button
						type="button"
						onClick={() => updateParam("inStock", currentInStock ? null : "true")}
						className={clsx(
							"flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
							currentInStock
								? "border-brand-primary bg-brand-primary text-content-inverse"
								: "border-line-subtle bg-surface-raised text-content-primary hover:border-brand-primary",
						)}
					>
						{t("inStockOnly")}
					</button>

					{/* Clear all */}
					{hasActiveFilters && (
						<button
							type="button"
							onClick={clearAllFilters}
							className="flex items-center gap-1 text-sm text-content-secondary transition-colors hover:text-status-danger"
						>
							<X size={14} aria-hidden="true" />
							{t("clearFilters")}
						</button>
					)}
				</div>
			</div>

			{/* ── Mobile: count + Filters button ──────────────────────── */}
			<div className="flex items-center justify-between sm:hidden">
				<p className="text-sm text-content-secondary">{t("count", { count: totalCount })}</p>
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					className="relative flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-primary"
				>
					{hasActiveFilters && (
						<span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-primary ring-2 ring-surface-base" />
					)}
					<SlidersHorizontal size={14} aria-hidden="true" />
					{t("filters")}
				</button>
			</div>

			{/* ── Mobile bottom sheet ──────────────────────────────────── */}
			{mobileOpen && (
				<>
					<div className="fixed inset-0 z-40 bg-content-primary/40" onClick={() => setMobileOpen(false)} />
					<div
						role="dialog"
						aria-label={t("filters")}
						className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface-raised px-4 pb-8 pt-4 shadow-elevated"
					>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-semibold text-content-primary">{t("filters")}</h3>
							<button type="button" onClick={() => setMobileOpen(false)} aria-label={t("clearFilters")}>
								<X size={20} className="text-content-secondary" aria-hidden="true" />
							</button>
						</div>

						{/* Sort */}
						<div className="mb-5">
							<p className="mb-2 text-sm font-medium text-content-primary">{t("sortBy")}</p>
							<div className="space-y-1">
								{sortOptions.map((opt) => (
									<button
										key={opt.value}
										type="button"
										className={clsx(
											"block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
											currentSort === opt.value
												? "bg-brand-primary text-content-inverse"
												: "text-content-primary hover:bg-surface-sunken",
										)}
										onClick={() => updateParam("sortBy", opt.value === "DATE" ? null : opt.value)}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>

						{/* Category */}
						{categories.length > 0 && (
							<div className="mb-5">
								<p className="mb-2 text-sm font-medium text-content-primary">{t("allCategories")}</p>
								<div className="space-y-1">
									<button
										type="button"
										className={clsx(
											"block w-full rounded-lg px-3 py-2 text-left text-sm",
											!currentCategory
												? "bg-brand-primary text-content-inverse"
												: "text-content-primary hover:bg-surface-sunken",
										)}
										onClick={() => updateParam("category", null)}
									>
										{t("allCategories")}
									</button>
									{categories.map((cat) => (
										<button
											key={cat.id}
											type="button"
											className={clsx(
												"block w-full rounded-lg px-3 py-2 text-left text-sm",
												currentCategory === cat.slug
													? "bg-brand-primary text-content-inverse"
													: "text-content-primary hover:bg-surface-sunken",
											)}
											onClick={() => updateParam("category", cat.slug)}
										>
											{cat.name}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Price range */}
						<div className="mb-5">
							<p className="mb-2 text-sm font-medium text-content-primary">{t("priceRange")}</p>
							<div className="mb-2 flex flex-wrap gap-1">
								{PRICE_PRESETS.map((preset) => (
									<button
										key={preset.label}
										type="button"
										className="rounded-full bg-surface-sunken px-2 py-1 text-xs text-content-secondary transition-colors hover:bg-brand-primary hover:text-content-inverse"
										onClick={() => {
											setLocalMinPrice(preset.min);
											setLocalMaxPrice(preset.max);
										}}
									>
										{preset.label}
									</button>
								))}
							</div>
							<div className="flex items-center gap-2">
								<input
									type="number"
									placeholder={t("minPrice")}
									value={localMinPrice}
									onChange={(e) => setLocalMinPrice(e.target.value)}
									className="w-full rounded-lg border border-line-subtle bg-surface-base px-2 py-1.5 text-sm text-content-primary focus:border-brand-primary focus:outline-none"
								/>
								<span className="text-content-secondary">–</span>
								<input
									type="number"
									placeholder={t("maxPrice")}
									value={localMaxPrice}
									onChange={(e) => setLocalMaxPrice(e.target.value)}
									className="w-full rounded-lg border border-line-subtle bg-surface-base px-2 py-1.5 text-sm text-content-primary focus:border-brand-primary focus:outline-none"
								/>
							</div>
							<button
								type="button"
								onClick={() => {
									applyPrice();
								}}
								className="mt-2 w-full rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-content-inverse"
							>
								{t("apply")}
							</button>
						</div>

						{/* In stock */}
						<div className="mb-5">
							<button
								type="button"
								onClick={() => updateParam("inStock", currentInStock ? null : "true")}
								className={clsx(
									"flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
									currentInStock
										? "border-brand-primary bg-brand-primary text-content-inverse"
										: "border-line-subtle text-content-primary",
								)}
							>
								{t("inStockOnly")}
								{currentInStock && <span className="text-xs">✓</span>}
							</button>
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							{hasActiveFilters && (
								<button
									type="button"
									onClick={clearAllFilters}
									className="flex-1 rounded-lg border border-line-subtle px-4 py-2.5 text-sm text-content-secondary transition-colors hover:text-status-danger"
								>
									{t("clearFilters")}
								</button>
							)}
							<button
								type="button"
								onClick={() => setMobileOpen(false)}
								className="flex-1 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-content-inverse"
							>
								{t("apply")}
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
