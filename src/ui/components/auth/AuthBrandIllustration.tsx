/**
 * Flat, simple line-art motif (nuts/spices) for the auth split-screen brand panel —
 * deliberately not photographic (no Unsplash dependency, see BrandStorySection's own
 * TODO about that). Colors come from currentColor + Tailwind fill/stroke utilities
 * mapped to design tokens, never hardcoded hex.
 */
export function AuthBrandIllustration({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 320 320"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className={className}
		>
			{/* Bowl */}
			<path
				d="M70 190c0 55.2 44.8 90 100 90s100-34.8 100-90"
				className="stroke-content-inverse/70"
				strokeWidth="6"
				strokeLinecap="round"
			/>
			<ellipse
				cx="170"
				cy="190"
				rx="100"
				ry="18"
				className="fill-brand-accent/25 stroke-content-inverse/70"
				strokeWidth="6"
			/>

			{/* Scattered nuts */}
			<ellipse
				cx="130"
				cy="170"
				rx="16"
				ry="12"
				className="fill-brand-accent/80"
				transform="rotate(-15 130 170)"
			/>
			<ellipse
				cx="170"
				cy="162"
				rx="18"
				ry="13"
				className="fill-content-inverse/90"
				transform="rotate(8 170 162)"
			/>
			<ellipse
				cx="210"
				cy="172"
				rx="15"
				ry="11"
				className="fill-brand-accent/60"
				transform="rotate(20 210 172)"
			/>
			<ellipse
				cx="150"
				cy="178"
				rx="10"
				ry="8"
				className="fill-content-inverse/60"
				transform="rotate(-30 150 178)"
			/>
			<ellipse
				cx="192"
				cy="180"
				rx="11"
				ry="8"
				className="fill-brand-accent/70"
				transform="rotate(35 192 180)"
			/>

			{/* Spice sprinkle dots */}
			<circle cx="90" cy="120" r="4" className="fill-content-inverse/50" />
			<circle cx="105" cy="100" r="3" className="fill-brand-accent/60" />
			<circle cx="230" cy="110" r="4" className="fill-content-inverse/50" />
			<circle cx="245" cy="130" r="3" className="fill-brand-accent/60" />
			<circle cx="160" cy="90" r="3.5" className="fill-content-inverse/40" />

			{/* Leaf accents flanking the bowl */}
			<path
				d="M60 150c-18-6-28-24-24-44 18 2 32 16 34 34"
				className="fill-brand-accent/30 stroke-content-inverse/60"
				strokeWidth="4"
			/>
			<path
				d="M280 150c18-6 28-24 24-44-18 2-32 16-34 34"
				className="fill-brand-accent/30 stroke-content-inverse/60"
				strokeWidth="4"
			/>
		</svg>
	);
}
