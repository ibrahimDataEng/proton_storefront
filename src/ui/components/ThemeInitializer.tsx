"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyTheme, getStoredTheme } from "@/lib/theme";

/**
 * Re-applies the persisted theme to <html> on every route change.
 *
 * Some navigations (e.g. next-intl's locale switch) reset unmanaged DOM
 * attributes like data-theme on <html> without re-running the inline
 * FOUC-prevention script from a fresh document load. This keeps the
 * applied theme in sync with localStorage regardless of navigation type.
 */
export function ThemeInitializer() {
	const pathname = usePathname();

	useEffect(() => {
		applyTheme(getStoredTheme());
	}, [pathname]);

	return null;
}
