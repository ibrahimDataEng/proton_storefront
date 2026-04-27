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
	onLeave: () => void;
}

export function SaveForLaterButton({ lineId, checkoutId, item, label, onLeave }: SaveForLaterButtonProps) {
	const [isPending, setIsPending] = useState(false);

	const handleClick = async () => {
		if (isPending) return;
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
		<button
			type="button"
			title={label}
			aria-label={label}
			disabled={isPending}
			className="text-content-secondary transition-colors hover:text-brand-primary disabled:cursor-not-allowed"
			onClick={() => void handleClick()}
		>
			<Bookmark size={18} aria-hidden="true" />
		</button>
	);
}
