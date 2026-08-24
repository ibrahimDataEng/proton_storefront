"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { MobileDrawer } from "./MobileDrawer";

type ChildCategory = {
	id: string;
	name: string;
	slug: string;
	translation?: { name?: string | null } | null;
};

type RootCategory = {
	id: string;
	name: string;
	slug: string;
	translation?: { name?: string | null } | null;
	children?: { edges: Array<{ node: ChildCategory }> } | null;
};

interface MobileNavClientProps {
	categories: RootCategory[];
}

export function MobileNavClient({ categories }: MobileNavClientProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			{/* Hamburger — outside Suspense, renders immediately */}
			<button
				className="flex h-8 w-8 items-center justify-center self-center md:hidden"
				onClick={() => setIsOpen(true)}
				aria-label="Open menu"
				aria-expanded={isOpen}
				aria-controls="mobile-drawer"
			>
				<MenuIcon className="h-6 w-6 shrink-0" aria-hidden />
			</button>

			<MobileDrawer categories={categories} isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
