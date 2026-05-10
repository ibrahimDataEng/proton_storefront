"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, LayoutGrid, ShoppingBag, User, ShoppingCart } from "lucide-react";
import clsx from "clsx";
import { CategoryBottomSheet } from "./CategoryBottomSheet";
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

interface BottomNavClientProps {
	categories: RootCategory[];
}

type NavPage = "home" | "categories" | "products" | "account" | "cart";

function getActivePage(pathname: string, channel: string): NavPage {
	// Strip /{locale}/{channel} prefix to get the page segment
	const stripped = pathname.replace(`/${channel}`, "");
	const parts = stripped.split("/").filter(Boolean);
	const page = parts[1] ?? ""; // parts[0] = locale, parts[1] = page

	if (page === "products") return "products";
	if (page === "account") return "account";
	if (page === "cart") return "cart";
	if (page === "categories") return "categories";
	return "home";
}

export function BottomNavClient({ categories }: BottomNavClientProps) {
	const t = useTranslations("bottomNav");
	const pathname = usePathname();
	const { channel } = useParams<{ channel: string }>();
	const [isCatOpen, setIsCatOpen] = useState(false);

	const activePage = getActivePage(pathname, channel ?? "default-channel");

	const iconCls = (active: boolean) =>
		clsx("h-[22px] w-[22px] shrink-0", active ? "text-brand-primary" : "text-content-secondary");

	const labelCls = (active: boolean) =>
		clsx(
			"mt-0.5 text-[10px] leading-none",
			active ? "font-semibold text-brand-primary" : "text-content-secondary",
		);

	const itemCls = "flex flex-1 flex-col items-center justify-center gap-0.5 py-2";

	return (
		<>
			<nav
				className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-line-subtle bg-surface-base md:hidden"
				style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
				aria-label="Bottom navigation"
			>
				{/* Home */}
				<LinkWithChannel href="/" className={itemCls}>
					<Home className={iconCls(activePage === "home")} />
					<span className={labelCls(activePage === "home")}>{t("home")}</span>
				</LinkWithChannel>

				{/* Categories — opens sheet */}
				<button
					className={itemCls}
					onClick={() => setIsCatOpen(true)}
					aria-label={t("categories")}
					aria-expanded={isCatOpen}
				>
					<LayoutGrid className={iconCls(isCatOpen || activePage === "categories")} />
					<span className={labelCls(isCatOpen || activePage === "categories")}>{t("categories")}</span>
				</button>

				{/* Shop */}
				<LinkWithChannel href="/products" className={itemCls}>
					<ShoppingBag className={iconCls(activePage === "products")} />
					<span className={labelCls(activePage === "products")}>{t("shop")}</span>
				</LinkWithChannel>

				{/* Account */}
				<LinkWithChannel href="/account" className={itemCls}>
					<User className={iconCls(activePage === "account")} />
					<span className={labelCls(activePage === "account")}>{t("account")}</span>
				</LinkWithChannel>

				{/* Cart */}
				<LinkWithChannel href="/cart" className={itemCls}>
					<ShoppingCart className={iconCls(activePage === "cart")} />
					<span className={labelCls(activePage === "cart")}>{t("cart")}</span>
				</LinkWithChannel>
			</nav>

			<CategoryBottomSheet categories={categories} isOpen={isCatOpen} onClose={() => setIsCatOpen(false)} />
		</>
	);
}
