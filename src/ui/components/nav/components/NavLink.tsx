"use client";

import clsx from "clsx";
import { type ReactElement } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import useSelectedPathname from "@/hooks/useSelectedPathname";

export function NavLink({ href, children }: { href: string; children: ReactElement | string }) {
	const pathname = useSelectedPathname();
	const isActive = pathname === href;

	return (
		<li className="inline-flex">
			<LinkWithChannel
				href={href}
				className={clsx(
					isActive ? "border-brand-primary text-brand-primary" : "border-transparent text-content-secondary",
					"inline-flex items-center border-b-2 pt-px text-sm font-medium transition-colors hover:text-content-primary",
				)}
			>
				{children}
			</LinkWithChannel>
		</li>
	);
}
