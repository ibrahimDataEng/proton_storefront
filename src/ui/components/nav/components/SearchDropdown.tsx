"use client";

import Image from "next/image";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { type SearchProductsQuery } from "@/gql/graphql";

type ProductEdge = NonNullable<SearchProductsQuery["products"]>["edges"][number];
type Product = ProductEdge["node"];

export type SearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface SearchDropdownProps {
	query: string;
	results: Product[];
	status: SearchStatus;
	highlightedIndex: number;
	listboxId: string;
	optionIdPrefix: string;
	locale: string;
	/** Called when a result row is hovered — pass the index (-1 to clear) */
	onHover: (index: number) => void;
	/** Called when "See all results" is hovered */
	onHoverSeeAll: () => void;
}

/** Skeleton row shown while loading */
function SkeletonRow() {
	return (
		<li role="option" aria-selected="false" className="flex items-center gap-3 px-3 py-2">
			<div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-line-subtle" />
			<div className="h-4 w-40 animate-pulse rounded bg-line-subtle" />
		</li>
	);
}

export function SearchDropdown({
	query,
	results,
	status,
	highlightedIndex,
	listboxId,
	optionIdPrefix,
	locale,
	onHover,
	onHoverSeeAll,
}: SearchDropdownProps) {
	const t = useTranslations("Search");
	const isRtl = locale === "ar";

	if (status === "idle" || status === "error") return null;

	return (
		<ul
			id={listboxId}
			role="listbox"
			aria-label={t("placeholder")}
			className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-line-subtle bg-surface-raised shadow-lg"
		>
			{status === "loading" && (
				<>
					<SkeletonRow />
					<SkeletonRow />
					<SkeletonRow />
				</>
			)}

			{status === "empty" && (
				<li role="option" aria-selected="false" className="px-3 py-3 text-sm text-content-secondary">
					{t("noResults")}
				</li>
			)}

			{status === "ready" &&
				results.map((product, index) => {
					const displayName = product.translation?.name ?? product.name;
					const isHighlighted = highlightedIndex === index;
					return (
						<li
							key={product.id}
							id={`${optionIdPrefix}-${index}`}
							role="option"
							aria-selected={isHighlighted}
							onMouseEnter={() => onHover(index)}
							onMouseLeave={() => onHover(-1)}
							className={[
								"flex items-center gap-3 px-3 py-2 transition-colors",
								isRtl ? "border-r-2" : "border-l-2",
								isHighlighted ? "border-brand-primary bg-surface-sunken" : "border-transparent",
							].join(" ")}
						>
							<LinkWithChannel
								href={`/products/${product.slug}`}
								className="flex w-full items-center gap-3 text-sm text-content-primary"
								tabIndex={-1}
							>
								{product.thumbnail ? (
									<Image
										src={product.thumbnail.url}
										alt={product.thumbnail.alt ?? displayName}
										width={40}
										height={40}
										className="h-10 w-10 shrink-0 rounded-md object-cover"
									/>
								) : (
									<div className="h-10 w-10 shrink-0 rounded-md bg-surface-sunken" />
								)}
								<span className="line-clamp-1">{displayName}</span>
							</LinkWithChannel>
						</li>
					);
				})}

			{status === "ready" && results.length > 0 && (
				<li
					id={`${optionIdPrefix}-see-all`}
					role="option"
					aria-selected={highlightedIndex === results.length}
					onMouseEnter={onHoverSeeAll}
					onMouseLeave={() => onHover(-1)}
					className={[
						"flex items-center gap-1 border-t border-line-subtle px-3 py-2.5 text-sm font-medium text-brand-primary transition-colors",
						isRtl ? "border-r-2" : "border-l-2",
						highlightedIndex === results.length
							? "border-brand-primary bg-surface-sunken"
							: "border-transparent",
					].join(" ")}
				>
					<LinkWithChannel
						href={`/search?query=${encodeURIComponent(query)}`}
						className="flex w-full items-center gap-1"
						tabIndex={-1}
					>
						<span className="line-clamp-1">{t("seeAll", { query })}</span>
						{isRtl ? (
							<ChevronRightIcon className="h-4 w-4 shrink-0 rotate-180" aria-hidden />
						) : (
							<ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
						)}
					</LinkWithChannel>
				</li>
			)}
		</ul>
	);
}
