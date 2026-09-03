// GA4 e-commerce event helper — every gtag call in the app must go through
// one of these typed functions rather than calling window.gtag() inline.

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}

export interface GA4Item {
	item_id: string;
	item_name: string;
	item_category?: string;
	price?: number;
	quantity?: number;
}

const CURRENCY = "AED";

function sendEvent(name: string, params: Record<string, unknown>) {
	if (typeof window === "undefined" || !window.gtag) return;
	window.gtag("event", name, params);
}

export function trackViewItem(item: GA4Item) {
	sendEvent("view_item", {
		currency: CURRENCY,
		value: item.price,
		items: [item],
	});
}

export function trackAddToCart(item: GA4Item) {
	sendEvent("add_to_cart", {
		currency: CURRENCY,
		value: item.price != null ? item.price * (item.quantity ?? 1) : undefined,
		items: [item],
	});
}

export function trackViewCart(params: { value: number; items: GA4Item[] }) {
	sendEvent("view_cart", {
		currency: CURRENCY,
		value: params.value,
		items: params.items,
	});
}

export function trackBeginCheckout(params: { value: number; items: GA4Item[] }) {
	sendEvent("begin_checkout", {
		currency: CURRENCY,
		value: params.value,
		items: params.items,
	});
}

export function trackAddShippingInfo(params: { value: number; items: GA4Item[]; shipping_tier?: string }) {
	sendEvent("add_shipping_info", {
		currency: CURRENCY,
		value: params.value,
		items: params.items,
		shipping_tier: params.shipping_tier,
	});
}

export function trackAddPaymentInfo(params: { value: number; items: GA4Item[] }) {
	sendEvent("add_payment_info", {
		currency: CURRENCY,
		value: params.value,
		items: params.items,
	});
}

export function trackPurchase(params: { transaction_id: string; value: number; items: GA4Item[] }) {
	sendEvent("purchase", {
		currency: CURRENCY,
		transaction_id: params.transaction_id,
		value: params.value,
		items: params.items,
	});
}
