"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import { MenuIcon } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useClickOutside } from "@/ui/hooks/useClickOutside";

const LINKS = [
	{ href: "/pages/wholesale", labelKey: "wholesale" },
	{ href: "/pages/become-supplier", labelKey: "supplier" },
	{ href: "/pages/contact-us", labelKey: "contact" },
	{ href: "/pages/about", labelKey: "about" },
] as const;

/** Mobile-only popup listing the 4 static pages not reachable from BottomNavClient. */
export function MobileLinksMenu() {
	const locale = useLocale();
	const t = useTranslations("nav");
	const isRtl = locale === "ar";

	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	useClickOutside(containerRef as React.RefObject<HTMLDivElement>, () => setOpen(false), open);

	useEffect(() => {
		if (!open) return;

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open]);

	return (
		<div ref={containerRef} className="relative md:hidden">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-label={t("openMenu")}
				aria-haspopup="true"
				aria-expanded={open}
				className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-default bg-surface-sunken text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
			>
				<MenuIcon className="h-4 w-4 shrink-0" aria-hidden />
			</button>

			<AnimatePresence>
				{open && (
					<m.div
						initial={{ opacity: 0, scaleY: 0.95 }}
						animate={{ opacity: 1, scaleY: 1 }}
						exit={{ opacity: 0, scaleY: 0.95 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
						style={{ transformOrigin: isRtl ? "top left" : "top right" }}
						className="absolute end-0 top-full z-40 mt-2 w-48 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line-subtle bg-surface-base shadow-xl"
						role="menu"
						aria-label={t("openMenu")}
					>
						{LINKS.map((link) => (
							<LinkWithChannel
								key={link.href}
								href={link.href}
								role="menuitem"
								onClick={() => setOpen(false)}
								className="block px-4 py-2.5 text-sm text-content-secondary transition-colors hover:bg-surface-raised hover:text-brand-primary"
							>
								{t(link.labelKey)}
							</LinkWithChannel>
						))}
					</m.div>
				)}
			</AnimatePresence>
		</div>
	);
}
