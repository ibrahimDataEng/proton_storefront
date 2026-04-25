export const colors = {
	brand: {
		primary: "#2D3B2E",
		accent: "#C9B79C",
		muted: "#8B7355",
	},
	surface: {
		base: "#FAF7F2",
		raised: "#FFFFFF",
		sunken: "#F5F1EA",
	},
	content: {
		primary: "#1A1F1A",
		secondary: "#5C6158",
		inverse: "#FAF7F2",
	},
	line: {
		subtle: "#E5E1DA",
		default: "#D2CDC4",
	},
	status: {
		success: "#3A6648",
		warning: "#A67C3C",
		danger: "#9E3E3E",
	},
} as const;

export const colorsDark = {
	brand: {
		primary: "#4A5D4A",
		accent: "#D4C4A8",
		muted: "#A89377",
	},
	surface: {
		base: "#141613",
		raised: "#1E211D",
		sunken: "#0F110E",
	},
	content: {
		primary: "#F5F2EC",
		secondary: "#A8AAA3",
		inverse: "#141613",
	},
	line: {
		subtle: "#282C26",
		default: "#373C34",
	},
	status: {
		success: "#7AA886",
		warning: "#D9B06C",
		danger: "#D07070",
	},
} as const;

export const radii = {
	sm: "4px",
	md: "8px",
	lg: "12px",
	xl: "16px",
	"2xl": "24px",
} as const;

export const shadows = {
	soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04)",
	raised: "0 4px 12px rgb(0 0 0 / 0.06), 0 2px 4px rgb(0 0 0 / 0.04)",
	elevated: "0 12px 32px rgb(0 0 0 / 0.08), 0 4px 8px rgb(0 0 0 / 0.04)",
} as const;

export type ColorToken = keyof typeof colors;
export type ColorDarkToken = keyof typeof colorsDark;
export type RadiusToken = keyof typeof radii;
export type ShadowToken = keyof typeof shadows;
