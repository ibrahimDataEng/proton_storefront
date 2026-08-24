"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import { isTopBarPath } from "./topbarPaths";
import { Container } from "@/ui/components/Container";

export function TopBar() {
	const pathname = usePathname();
	const t = useTranslations("topbar");
	const [tickerIndex, setTickerIndex] = useState(0);

	const visible = isTopBarPath(pathname);

	const messages = [
		`✓ ${t("invoices")}`,
		`📦 ${t("wholesale")}`,
		`🌍 ${t("countries")}`,
		`⭐ ${t("quality")}`,
	];

	// Expose topbar height as a CSS variable so HeaderWrapper + content can offset
	useEffect(() => {
		document.documentElement.style.setProperty("--topbar-height", visible ? "36px" : "0px");
	}, [visible]);

	useEffect(() => {
		if (!visible) return;
		const id = setInterval(() => {
			setTickerIndex((i) => (i + 1) % messages.length);
		}, 4000);
		return () => clearInterval(id);
	}, [visible, messages.length]);

	if (!visible) return null;

	return (
		<div role="banner" className="fixed inset-x-0 top-0 z-[51] h-9 bg-[#0D1410]">
			<Container className="flex h-full items-center justify-between">
				<p className="shrink-0 text-xs text-white">🚚 {t("freeShipping")}</p>

				<div className="relative flex h-5 items-center overflow-hidden">
					<AnimatePresence mode="wait">
						<m.p
							key={tickerIndex}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.4 }}
							className="absolute right-0 whitespace-nowrap text-xs text-white"
						>
							{messages[tickerIndex]}
						</m.p>
					</AnimatePresence>
				</div>
			</Container>
		</div>
	);
}
