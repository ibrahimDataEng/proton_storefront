"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

interface HeaderWrapperProps {
	children: React.ReactNode;
}

export function HeaderWrapper({ children }: HeaderWrapperProps) {
	const [visible, setVisible] = useState(true);
	const lastScrollY = useRef(0);
	const ticking = useRef(false);

	useEffect(() => {
		const handleScroll = () => {
			if (ticking.current) return;
			ticking.current = true;

			requestAnimationFrame(() => {
				const currentScrollY = window.scrollY;
				const scrollingDown = currentScrollY > lastScrollY.current;
				const pastThreshold = currentScrollY > 80;

				if (scrollingDown && pastThreshold) {
					setVisible(false);
				} else {
					setVisible(true);
				}

				lastScrollY.current = currentScrollY;
				ticking.current = false;
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header
			className={clsx(
				"fixed inset-x-0 z-50 h-16",
				"bg-surface-base/80 backdrop-blur-md",
				"border-b border-line-subtle",
				"transition-transform duration-300 ease-in-out",
				visible ? "translate-y-0" : "-translate-y-full",
			)}
			style={{ top: "var(--topbar-height, 0px)" }}
		>
			{children}
		</header>
	);
}
