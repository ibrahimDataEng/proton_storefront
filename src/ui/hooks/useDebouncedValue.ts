"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after
 * `delay` milliseconds of inactivity. Cancels the timer when the
 * component unmounts or when value/delay change.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}
