"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SearchDropdown, type SearchStatus } from "./SearchDropdown";
import { onSearchSubmit } from "./searchActions";
import {
	OrderDirection,
	ProductOrderField,
	SearchProductsDocument,
	type SearchProductsQuery,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { useDebouncedValue } from "@/ui/hooks/useDebouncedValue";
import { useClickOutside } from "@/ui/hooks/useClickOutside";

type Product = NonNullable<SearchProductsQuery["products"]>["edges"][number]["node"];

interface SearchBarProps {
	channel: string;
	locale: string;
}

export const SearchBar = ({ channel, locale }: SearchBarProps) => {
	const t = useTranslations("Search");
	const router = useRouter();
	const uid = useId();
	const listboxId = `${uid}-listbox`;
	const optionIdPrefix = `${uid}-option`;
	const statusRegionId = `${uid}-status`;

	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Product[]>([]);
	const [status, setStatus] = useState<SearchStatus>("idle");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isOpen, setIsOpen] = useState(false);

	const debouncedQuery = useDebouncedValue(query, 300);
	const requestIdRef = useRef(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Close dropdown on outside click
	const handleOutsideClick = useCallback(() => {
		setIsOpen(false);
		setHighlightedIndex(-1);
	}, []);

	useClickOutside(containerRef, handleOutsideClick, isOpen);

	// Fire search query whenever debouncedQuery changes
	useEffect(() => {
		const trimmed = debouncedQuery.trim();
		if (trimmed.length < 2) {
			setResults([]);
			setStatus("idle");
			setIsOpen(false);
			setHighlightedIndex(-1);
			return;
		}

		const currentRequestId = ++requestIdRef.current;
		setStatus("loading");
		setIsOpen(true);
		setHighlightedIndex(-1);

		void (async () => {
			try {
				const language = getSaleorLanguage(locale);
				const data = await executeGraphQL(SearchProductsDocument, {
					variables: {
						search: trimmed,
						sortBy: ProductOrderField.Rating,
						sortDirection: OrderDirection.Asc,
						first: 5,
						channel,
						language,
					},
					withAuth: false,
				});

				// Discard if a newer request has started
				if (currentRequestId !== requestIdRef.current) return;

				const edges = data.products?.edges ?? [];
				setResults(edges.map((e) => e.node));
				setStatus(edges.length === 0 ? "empty" : "ready");
			} catch {
				if (currentRequestId !== requestIdRef.current) return;
				setStatus("error");
			}
		})();
	}, [debouncedQuery, channel, locale]);

	// Total navigable items: results + "see all" row (only when ready)
	const itemCount = status === "ready" ? results.length + 1 : 0;

	function navigateToHighlighted() {
		if (highlightedIndex === -1) return false;
		if (status === "ready" && highlightedIndex < results.length) {
			const product = results[highlightedIndex];
			router.push(`/${encodeURIComponent(channel)}/products/${product.slug}`);
			setIsOpen(false);
			return true;
		}
		if (status === "ready" && highlightedIndex === results.length) {
			router.push(`/${encodeURIComponent(channel)}/search?query=${encodeURIComponent(query.trim())}`);
			setIsOpen(false);
			return true;
		}
		return false;
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (!isOpen && query.trim().length >= 2) {
					setIsOpen(true);
					return;
				}
				setHighlightedIndex((prev) => (itemCount === 0 ? -1 : (prev + 1) % itemCount));
				break;

			case "ArrowUp":
				e.preventDefault();
				if (!isOpen) return;
				setHighlightedIndex((prev) => (itemCount === 0 ? -1 : prev <= 0 ? itemCount - 1 : prev - 1));
				break;

			case "Enter":
				if (navigateToHighlighted()) {
					e.preventDefault();
				}
				// else: fall through to form submit (server action handles redirect)
				break;

			case "Escape":
				e.preventDefault();
				if (highlightedIndex !== -1) {
					setHighlightedIndex(-1);
				} else {
					setIsOpen(false);
				}
				break;

			case "Tab":
				setIsOpen(false);
				setHighlightedIndex(-1);
				break;
		}
	}

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		setQuery(value);
		if (value.trim().length >= 2) {
			setIsOpen(true);
		}
	}

	function handleFocus() {
		if (query.trim().length >= 2 && status !== "idle") {
			setIsOpen(true);
		}
	}

	// Highlighted option id for aria-activedescendant
	const activeDescendant =
		isOpen && highlightedIndex !== -1
			? highlightedIndex === results.length
				? `${optionIdPrefix}-see-all`
				: `${optionIdPrefix}-${highlightedIndex}`
			: undefined;

	return (
		<div ref={containerRef} className="relative w-full">
			{/* Accessible live status region */}
			<div id={statusRegionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
				{status === "loading" ? t("searching") : ""}
			</div>

			<form action={(formData) => onSearchSubmit(formData, channel)} className="group relative w-full">
				<label className="w-full">
					<span className="sr-only">{t("placeholder")}</span>
					<input
						ref={inputRef}
						type="text"
						name="search"
						role="combobox"
						aria-expanded={isOpen && status !== "idle"}
						aria-controls={listboxId}
						aria-autocomplete="list"
						aria-activedescendant={activeDescendant}
						value={query}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						placeholder={t("placeholder")}
						autoComplete="off"
						className="h-10 w-full rounded-md border border-line-default bg-surface-base px-4 py-2 pr-10 text-sm text-content-primary transition-colors placeholder:text-content-secondary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rtl:pl-10 rtl:pr-4"
					/>
				</label>

				{/* Right-side icon: spinner while loading, search icon otherwise */}
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
					{status === "loading" ? (
						<LoaderCircleIcon className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
					) : (
						<button
							type="submit"
							className="pointer-events-auto inline-flex aspect-square w-8 items-center justify-center text-content-secondary transition-colors hover:text-brand-primary focus:text-brand-primary group-invalid:pointer-events-none group-invalid:opacity-80"
							tabIndex={-1}
						>
							<span className="sr-only">{t("placeholder")}</span>
							<SearchIcon aria-hidden className="h-4 w-4" />
						</button>
					)}
				</div>
			</form>

			{isOpen && status !== "idle" && (
				<SearchDropdown
					query={query}
					results={results}
					status={status}
					highlightedIndex={highlightedIndex}
					listboxId={listboxId}
					optionIdPrefix={optionIdPrefix}
					locale={locale}
					onHover={setHighlightedIndex}
					onHoverSeeAll={() => setHighlightedIndex(results.length)}
				/>
			)}
		</div>
	);
};
