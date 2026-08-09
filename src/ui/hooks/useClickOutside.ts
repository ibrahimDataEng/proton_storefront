"use client";

import { type RefObject, useEffect } from "react";

/**
 * Calls `handler` when the user clicks (or taps) outside the element
 * referenced by `ref`. Attaches to `mousedown` + `touchstart` so it
 * fires before the click event and avoids flickering on mobile.
 */
export function useClickOutside<T extends HTMLElement>(
	ref: RefObject<T | null>,
	handler: (event: MouseEvent | TouchEvent) => void,
	enabled: boolean = true,
): void {
	useEffect(() => {
		if (!enabled) return;

		function listener(event: MouseEvent | TouchEvent) {
			const el = ref.current;
			if (!el || el.contains(event.target as Node)) return;
			handler(event);
		}

		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);

		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, handler, enabled]);
}
