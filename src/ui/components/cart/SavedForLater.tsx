"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Bookmark, BookmarkX } from "lucide-react";
import { useTranslations } from "next-intl";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoney } from "@/lib/utils";

export type SavedItem = {
	id: string;
	variantId: string;
	productSlug: string;
	productName: string;
	categoryName: string;
	thumbnailUrl: string;
	thumbnailAlt: string;
	unitPrice: { amount: number; currency: string } | null;
	quantity: number;
};

const STORAGE_KEY = "savedForLater";
const CHANGE_EVENT = "savedForLaterChanged";

function readStorage(): SavedItem[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as SavedItem[]) : [];
	} catch {
		return [];
	}
}

function writeStorage(items: SavedItem[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSavedItems() {
	const [items, setItems] = useState<SavedItem[]>([]);

	useEffect(() => {
		const load = () => setItems(readStorage());
		load();
		window.addEventListener(CHANGE_EVENT, load);
		return () => window.removeEventListener(CHANGE_EVENT, load);
	}, []);

	const saveItem = (item: SavedItem) => {
		const current = readStorage();
		const updated = [...current.filter((i) => i.id !== item.id), item];
		writeStorage(updated);
	};

	const removeItem = (id: string) => {
		const current = readStorage();
		writeStorage(current.filter((i) => i.id !== id));
	};

	const isSaved = (id: string) => items.some((i) => i.id === id);

	return { items, saveItem, removeItem, isSaved };
}

interface SaveForLaterButtonProps {
	item: SavedItem;
	label: string;
}

export function SaveForLaterButton({ item, label }: SaveForLaterButtonProps) {
	const { saveItem, removeItem, isSaved } = useSavedItems();
	const saved = isSaved(item.id);

	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={saved}
			className="text-content-secondary transition-colors hover:text-brand-primary"
			onClick={() => (saved ? removeItem(item.id) : saveItem(item))}
		>
			<Bookmark
				size={18}
				aria-hidden="true"
				className={saved ? "fill-brand-primary text-brand-primary" : ""}
			/>
		</button>
	);
}

export function SavedForLater() {
	const t = useTranslations("cart");
	const { items, removeItem } = useSavedItems();

	if (items.length === 0) return null;

	return (
		<section className="mt-12">
			<h2 className="mb-6 text-xl font-semibold text-content-primary">{t("savedForLater")}</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-raised p-4 shadow-soft"
					>
						<div className="aspect-square overflow-hidden rounded-lg bg-surface-sunken">
							{item.thumbnailUrl ? (
								<Image
									src={item.thumbnailUrl}
									alt={item.thumbnailAlt}
									width={200}
									height={200}
									className="h-full w-full object-contain"
								/>
							) : (
								<div className="h-full w-full" />
							)}
						</div>

						<div className="flex flex-1 flex-col gap-1">
							<p className="line-clamp-2 text-sm font-semibold text-content-primary">{item.productName}</p>
							{item.categoryName && <p className="text-xs text-content-secondary">{item.categoryName}</p>}
							{item.unitPrice && (
								<p className="text-sm text-content-secondary">
									{formatMoney(item.unitPrice.amount, item.unitPrice.currency)}
								</p>
							)}
						</div>

						<div className="flex gap-2">
							<LinkWithChannel
								href={`/products/${item.productSlug}`}
								className="flex-1 rounded-md bg-brand-primary px-3 py-2 text-center text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
							>
								{t("moveToCart")}
							</LinkWithChannel>
							<button
								type="button"
								aria-label={t("remove")}
								className="rounded-md p-2 text-content-secondary transition-colors hover:text-status-danger"
								onClick={() => removeItem(item.id)}
							>
								<BookmarkX size={16} aria-hidden="true" />
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
