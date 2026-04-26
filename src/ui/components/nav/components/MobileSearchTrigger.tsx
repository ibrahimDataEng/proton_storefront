"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchOverlay } from "./SearchOverlay";

interface MobileSearchTriggerProps {
	channel: string;
	locale: string;
}

/**
 * Shown on mobile (<lg). Renders a search icon button that opens
 * the full-screen SearchOverlay when tapped.
 */
export function MobileSearchTrigger({ channel, locale }: MobileSearchTriggerProps) {
	const t = useTranslations("Search");
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				aria-label={t("openSearch")}
				className="flex h-10 w-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
			>
				<SearchIcon className="h-5 w-5" aria-hidden />
			</button>

			{isOpen && <SearchOverlay channel={channel} locale={locale} onClose={() => setIsOpen(false)} />}
		</>
	);
}
