// TEMPORARY: remove before merging
import { Button } from "@/ui/components/Button";
import { Container } from "@/ui/components/Container";

export default function ThemePreviewPage() {
	return (
		<div className="min-h-screen bg-surface-base py-16">
			<Container size="lg">
				<h1 className="mb-12 text-3xl font-semibold text-content-primary">Theme Preview</h1>

				{/* Colors */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Colors</h2>
					<div className="flex flex-wrap gap-3">
						<div className="flex h-16 w-32 items-end rounded-md bg-brand-primary p-2">
							<span className="text-xs text-content-inverse">brand.primary</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md border border-line-subtle bg-brand-accent p-2">
							<span className="text-xs text-content-primary">brand.accent</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md bg-brand-muted p-2">
							<span className="text-xs text-content-inverse">brand.muted</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md border border-line-default bg-surface-raised p-2">
							<span className="text-xs text-content-secondary">surface.raised</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md border border-line-subtle bg-surface-sunken p-2">
							<span className="text-xs text-content-secondary">surface.sunken</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md bg-status-success p-2">
							<span className="text-xs text-content-inverse">status.success</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md bg-status-warning p-2">
							<span className="text-xs text-content-inverse">status.warning</span>
						</div>
						<div className="flex h-16 w-32 items-end rounded-md bg-status-danger p-2">
							<span className="text-xs text-content-inverse">status.danger</span>
						</div>
					</div>
				</section>

				{/* Typography */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Typography — IBM Plex Sans</h2>
					<div className="space-y-2">
						<p className="text-3xl font-light text-content-primary">Light 300 — The quick brown fox</p>
						<p className="text-3xl font-normal text-content-primary">Regular 400 — The quick brown fox</p>
						<p className="text-3xl font-medium text-content-primary">Medium 500 — The quick brown fox</p>
						<p className="text-3xl font-semibold text-content-primary">Semibold 600 — The quick brown fox</p>
						<p className="text-3xl font-bold text-content-primary">Bold 700 — The quick brown fox</p>
						<p className="text-lg text-content-secondary">Secondary text — مرحبًا بالعالم (Arabic test)</p>
					</div>
				</section>

				{/* Buttons — Primary */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Button — Primary</h2>
					<div className="flex flex-wrap items-center gap-4">
						<Button variant="primary" size="sm">
							Small
						</Button>
						<Button variant="primary" size="md">
							Medium
						</Button>
						<Button variant="primary" size="lg">
							Large
						</Button>
						<Button variant="primary" size="md" loading>
							Loading
						</Button>
						<Button variant="primary" size="md" disabled>
							Disabled
						</Button>
					</div>
				</section>

				{/* Buttons — Secondary */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Button — Secondary</h2>
					<div className="flex flex-wrap items-center gap-4">
						<Button variant="secondary" size="sm">
							Small
						</Button>
						<Button variant="secondary" size="md">
							Medium
						</Button>
						<Button variant="secondary" size="lg">
							Large
						</Button>
						<Button variant="secondary" size="md" loading>
							Loading
						</Button>
						<Button variant="secondary" size="md" disabled>
							Disabled
						</Button>
					</div>
				</section>

				{/* Buttons — Ghost */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Button — Ghost</h2>
					<div className="flex flex-wrap items-center gap-4">
						<Button variant="ghost" size="sm">
							Small
						</Button>
						<Button variant="ghost" size="md">
							Medium
						</Button>
						<Button variant="ghost" size="lg">
							Large
						</Button>
						<Button variant="ghost" size="md" loading>
							Loading
						</Button>
						<Button variant="ghost" size="md" disabled>
							Disabled
						</Button>
					</div>
				</section>

				{/* Shadows */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Shadows</h2>
					<div className="flex flex-wrap gap-6">
						<div className="flex h-24 w-40 items-center justify-center rounded-lg bg-surface-raised shadow-soft">
							<span className="text-sm text-content-secondary">shadow-soft</span>
						</div>
						<div className="flex h-24 w-40 items-center justify-center rounded-lg bg-surface-raised shadow-raised">
							<span className="text-sm text-content-secondary">shadow-raised</span>
						</div>
						<div className="flex h-24 w-40 items-center justify-center rounded-lg bg-surface-raised shadow-elevated">
							<span className="text-sm text-content-secondary">shadow-elevated</span>
						</div>
					</div>
				</section>

				{/* Container sizes */}
				<section className="mb-12">
					<h2 className="mb-4 text-xl font-medium text-content-primary">Container Sizes (outlined)</h2>
					<div className="space-y-3">
						{(["sm", "md", "lg", "xl"] as const).map((size) => (
							<Container
								key={size}
								size={size}
								className="rounded-md border border-line-default py-3 text-center text-sm text-content-secondary"
							>
								Container size=&quot;{size}&quot;
							</Container>
						))}
					</div>
				</section>
			</Container>
		</div>
	);
}
