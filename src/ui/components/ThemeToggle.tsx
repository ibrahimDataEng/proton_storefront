"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { m, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

interface Props {
	className?: string;
	/** "inverse" is for placement on dark/brand surfaces (e.g. the footer). */
	variant?: "default" | "inverse";
}

export function ThemeToggle({ className, variant = "default" }: Props) {
	const t = useTranslations("theme");
	const pathname = usePathname();
	const [mounted, setMounted] = useState(false);
	const [theme, setTheme] = useState<Theme>("light");

	// Re-reads localStorage (the single source of truth) on mount and on every
	// route change, since some navigations (e.g. locale switches) can reset
	// the data-theme attribute on <html> without remounting this component.
	useEffect(() => {
		setTheme(getStoredTheme());
		setMounted(true);
	}, [pathname]);

	const toggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyTheme(next);
	};

	// Avoid a hydration mismatch: render a neutral placeholder until the
	// real persisted theme is read on mount.
	if (!mounted) {
		return <span className={clsx("inline-block h-8 w-8", className)} aria-hidden="true" />;
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
			className={clsx(
				"flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
				variant === "inverse"
					? "text-content-footer/70 hover:bg-content-footer/10 hover:text-content-footer"
					: "text-content-secondary hover:bg-surface-sunken hover:text-content-primary",
				className,
			)}
		>
			<AnimatePresence mode="wait" initial={false}>
				{theme === "dark" ? (
					<m.span
						key="sun"
						initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.7, rotate: 90 }}
						transition={{ duration: 0.2 }}
						className="flex"
					>
						<Sun size={18} aria-hidden="true" />
					</m.span>
				) : (
					<m.span
						key="moon"
						initial={{ opacity: 0, scale: 0.7, rotate: 90 }}
						animate={{ opacity: 1, scale: 1, rotate: 0 }}
						exit={{ opacity: 0, scale: 0.7, rotate: -90 }}
						transition={{ duration: 0.2 }}
						className="flex"
					>
						<Moon size={18} aria-hidden="true" />
					</m.span>
				)}
			</AnimatePresence>
		</button>
	);
}
