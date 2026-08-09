"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { SavedItem } from "./SavedForLater";
import { deleteLineFromCheckout } from "@/app/[locale]/[channel]/(main)/cart/actions";

const STORAGE_KEY = "savedForLater";
const CHANGE_EVENT = "savedForLaterChanged";

interface SaveForLaterButtonProps {
	lineId: string;
	checkoutId: string;
	item: SavedItem;
	label: string;
	alreadySavedLabel?: string;
	onLeave: () => void;
}

export function SaveForLaterButton({
	lineId,
	checkoutId,
	item,
	label,
	alreadySavedLabel,
	onLeave,
}: SaveForLaterButtonProps) {
	const [isPending, setIsPending] = useState(false);
	const [alreadySaved, setAlreadySaved] = useState(false);

	const handleClick = async () => {
		if (isPending) return;

		// Duplicate check — same variantId already saved
		try {
			const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedItem[];
			if (current.some((i) => i.variantId === item.variantId)) {
				setAlreadySaved(true);
				setTimeout(() => setAlreadySaved(false), 2000);
				return;
			}
		} catch {
			// localStorage unavailable — proceed normally
		}

		setIsPending(true);
		onLeave(); // trigger exit animation on the parent line card

		// Wait for the CSS exit animation to finish (300ms) + small buffer
		await new Promise<void>((resolve) => setTimeout(() => resolve(), 350));

		try {
			const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedItem[];
			const updated = [...current.filter((i) => i.id !== item.id), item];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			window.dispatchEvent(new Event(CHANGE_EVENT));
		} catch {
			// localStorage unavailable — skip silently
		}

		await deleteLineFromCheckout({ lineId, checkoutId });
	};

	return (
		<div className="relative">
			<button
				type="button"
				title={label}
				aria-label={label}
				disabled={isPending}
				className="flex h-8 w-8 items-center justify-center text-content-secondary transition-colors hover:text-brand-primary disabled:cursor-not-allowed"
				onClick={() => void handleClick()}
			>
				<Bookmark size={18} aria-hidden="true" />
			</button>
			{alreadySaved && alreadySavedLabel && (
				<span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface-raised px-2 py-1 text-xs text-content-secondary shadow-raised">
					{alreadySavedLabel}
				</span>
			)}
		</div>
	);
}
