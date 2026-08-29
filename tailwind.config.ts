import TypographyPlugin from "@tailwindcss/typography";
import FormPlugin from "@tailwindcss/forms";
import ContainerQueriesPlugin from "@tailwindcss/container-queries";
import { type Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class", '[data-theme="dark"]'],
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				brand: {
					primary: "rgb(var(--color-brand-primary) / <alpha-value>)",
					accent: "rgb(var(--color-brand-accent) / <alpha-value>)",
					muted: "rgb(var(--color-brand-muted) / <alpha-value>)",
				},
				surface: {
					base: "rgb(var(--color-surface-base) / <alpha-value>)",
					raised: "rgb(var(--color-surface-raised) / <alpha-value>)",
					sunken: "rgb(var(--color-surface-sunken) / <alpha-value>)",
					footer: "rgb(var(--color-surface-footer) / <alpha-value>)",
				},
				content: {
					primary: "rgb(var(--color-text-primary) / <alpha-value>)",
					secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
					inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
					footer: "rgb(var(--color-text-footer) / <alpha-value>)",
				},
				line: {
					subtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
					default: "rgb(var(--color-border-default) / <alpha-value>)",
				},
				status: {
					success: "rgb(var(--color-success) / <alpha-value>)",
					warning: "rgb(var(--color-warning) / <alpha-value>)",
					danger: "rgb(var(--color-danger) / <alpha-value>)",
				},
			},
			fontFamily: {
				sans: ["var(--font-plex-sans)", "var(--font-plex-arabic)", "system-ui", "sans-serif"],
			},
			borderRadius: {
				sm: "4px",
				md: "8px",
				lg: "12px",
				xl: "16px",
				"2xl": "24px",
			},
			boxShadow: {
				soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 2px 8px rgb(0 0 0 / 0.04)",
				raised: "0 4px 12px rgb(0 0 0 / 0.06), 0 2px 4px rgb(0 0 0 / 0.04)",
				elevated: "0 12px 32px rgb(0 0 0 / 0.08), 0 4px 8px rgb(0 0 0 / 0.04)",
			},
			transitionDuration: {
				DEFAULT: "180ms",
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
			},
			animation: {
				"fade-in": "fadeIn 200ms ease-in",
			},
		},
	},
	plugins: [TypographyPlugin, FormPlugin, ContainerQueriesPlugin],
};

export default config;
