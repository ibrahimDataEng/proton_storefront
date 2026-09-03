"use client";

import { useEffect } from "react";
import { trackViewCart, type GA4Item } from "@/lib/analytics/gtag";

interface CartViewTrackerProps {
	checkoutId: string;
	value: number;
	items: GA4Item[];
}

// Server Component parents (OrderSummary) cannot call gtag directly, so this
// client boundary exists solely to fire view_cart once per cart/checkout id.
export function CartViewTracker({ checkoutId, value, items }: CartViewTrackerProps) {
	useEffect(() => {
		trackViewCart({ value, items });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [checkoutId]);

	return null;
}
