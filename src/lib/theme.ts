export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

/**
 * Single source of truth: reads the persisted choice, defaulting to light.
 * Deliberately does NOT fall back to `prefers-color-scheme` — first-time
 * visitors must always see light mode regardless of OS/browser setting.
 */
export function getStoredTheme(): Theme {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === "dark" || stored === "light") return stored;
	} catch {
		// localStorage unavailable (private mode, etc.) — default to light
	}
	return "light";
}

/** Applies the theme to the document and persists it. */
export function applyTheme(theme: Theme) {
	if (theme === "dark") {
		document.documentElement.setAttribute("data-theme", "dark");
	} else {
		document.documentElement.removeAttribute("data-theme");
	}
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// localStorage unavailable (private mode, etc.) — theme still applies for this session
	}
}
