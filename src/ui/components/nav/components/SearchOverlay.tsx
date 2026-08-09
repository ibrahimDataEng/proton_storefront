"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";
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

type Product = NonNullable<SearchProductsQuery["products"]>["edges"][number]["node"];

interface SearchOverlayProps {
	channel: string;
	locale: string;
	onClose: () => void;
}

/**
 * Full-screen search overlay for mobile viewports.
 * Mounted/unmounted by the parent — focus is captured on mount.
 */
export function SearchOverlay({ channel, locale, onClose }: SearchOverlayProps) {
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
	const inputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	// Lock body scroll while overlay is open; restore on unmount
	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	// Autofocus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Trap focus inside the overlay
	useEffect(() => {
		function handleFocusTrap(e: KeyboardEvent) {
			if (e.key !== "Tab" || !overlayRef.current) return;
			const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last?.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first?.focus();
				}
			}
		}
		document.addEventListener("keydown", handleFocusTrap);
		return () => document.removeEventListener("keydown", handleFocusTrap);
	}, []);

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

	const itemCount = status === "ready" ? results.length + 1 : 0;

	function navigateToHighlighted(): boolean {
		if (highlightedIndex === -1) return false;
		if (status === "ready" && highlightedIndex < results.length) {
			const product = results[highlightedIndex];
			router.push(`/${encodeURIComponent(channel)}/products/${product.slug}`);
			onClose();
			return true;
		}
		if (status === "ready" && highlightedIndex === results.length) {
			router.push(`/${encodeURIComponent(channel)}/search?query=${encodeURIComponent(query.trim())}`);
			onClose();
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
				break;

			case "Escape":
				e.preventDefault();
				if (highlightedIndex !== -1) {
					setHighlightedIndex(-1);
				} else {
					onClose();
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
		if (value.trim().length >= 2) setIsOpen(true);
	}

	const handleFormSubmit = useCallback(
		async (formData: FormData) => {
			await onSearchSubmit(formData, channel);
			onClose();
		},
		[channel, onClose],
	);

	const activeDescendant =
		isOpen && highlightedIndex !== -1
			? highlightedIndex === results.length
				? `${optionIdPrefix}-see-all`
				: `${optionIdPrefix}-${highlightedIndex}`
			: undefined;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-surface-base/80 backdrop-blur-sm"
				aria-hidden="true"
				onClick={onClose}
			/>

			{/* Overlay panel */}
			<div
				ref={overlayRef}
				role="dialog"
				aria-modal="true"
				aria-label={t("placeholder")}
				className="pb-safe pt-safe fixed inset-x-0 top-0 z-50 flex flex-col bg-surface-base shadow-lg"
			>
				{/* Accessible live status region */}
				<div id={statusRegionId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
					{status === "loading" ? t("searching") : ""}
				</div>

				{/* Header row: input + close button */}
				<div className="flex items-center gap-2 border-b border-line-subtle px-4 py-3">
					<form action={handleFormSubmit} className="group relative flex-1">
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
								placeholder={t("placeholder")}
								autoComplete="off"
								className="h-10 w-full rounded-md border border-line-default bg-surface-base px-4 py-2 pr-10 text-sm text-content-primary transition-colors placeholder:text-content-secondary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rtl:pl-10 rtl:pr-4"
							/>
						</label>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
							{status === "loading" ? (
								<LoaderCircleIcon className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
							) : (
								<SearchIcon className="h-4 w-4 text-content-secondary" aria-hidden />
							)}
						</div>
					</form>

					<button
						type="button"
						onClick={onClose}
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content-primary"
						aria-label={t("closeSearch")}
					>
						<XIcon className="h-5 w-5" aria-hidden />
					</button>
				</div>

				{/* Results */}
				{isOpen && status !== "idle" && (
					<div className="relative px-4 pt-2">
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
					</div>
				)}
			</div>
		</>
	);
}
