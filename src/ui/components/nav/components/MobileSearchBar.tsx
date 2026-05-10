"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchOverlay } from "./SearchOverlay";

interface MobileSearchBarProps {
	channel: string;
	locale: string;
}

export function MobileSearchBar({ channel, locale }: MobileSearchBarProps) {
	const t = useTranslations("Search");
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				aria-label={t("openSearch")}
				className="flex h-9 w-full items-center gap-2 rounded-full border border-line-default bg-surface-sunken px-4 text-sm text-content-secondary transition-colors hover:border-brand-primary"
			>
				<SearchIcon className="h-4 w-4 shrink-0" aria-hidden />
				<span className="truncate">{t("placeholder")}</span>
			</button>
			{isOpen && <SearchOverlay channel={channel} locale={locale} onClose={() => setIsOpen(false)} />}
		</>
	);
}
