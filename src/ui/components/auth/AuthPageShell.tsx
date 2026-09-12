import type { ReactNode } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";

type Props = {
	title: string;
	children: ReactNode;
};

/**
 * Shared split-screen shell for the standalone /login and /register pages.
 * Desktop (lg+): two-column grid, brand panel + form card. Mobile: single column,
 * AuthBrandPanel collapses itself into a compact header band (see that component).
 * Grid auto-placement mirrors correctly under RTL with no manual order swap needed —
 * verified live, same discipline as the checkout OrderConfirmation RTL check.
 */
export function AuthPageShell({ title, children }: Props) {
	return (
		<main className="lg:grid lg:min-h-screen lg:grid-cols-2">
			<AuthBrandPanel />
			<div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
				<div className="w-full max-w-md">
					<h1 className="mb-6 text-center text-2xl font-semibold text-content-primary lg:text-start">
						{title}
					</h1>
					<div className="rounded-2xl border border-line-subtle bg-surface-raised p-6 shadow-raised sm:p-8">
						{children}
					</div>
				</div>
			</div>
		</main>
	);
}
