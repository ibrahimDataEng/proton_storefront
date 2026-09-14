/**
 * Records which payment gateway completed the checkout, so OrderConfirmation
 * can show gateway-specific content (e.g. the COD cash reminder) without
 * needing to query Order.transactions/events — both require
 * MANAGE_ORDERS/HANDLE_PAYMENTS, which a guest viewing their own order
 * confirmation doesn't have. No such signal exists on the publicly-queryable
 * Order type at all.
 *
 * sessionStorage, not a cookie or URL param: useCheckoutComplete's redirect
 * uses `replaceWholeQuery: true`, so a URL param set beforehand would be
 * wiped; sessionStorage survives that same-tab `window.location.href`
 * navigation untouched.
 *
 * The marker is bound to the first order confirmation that reads it. The
 * original plain-string marker was never cleared, so after a COD order every
 * later order in the same tab session — including one paid by card — showed
 * the cash-on-delivery reminder. Now a marker claimed by one order is ignored
 * for any other order, and an unclaimed marker is dropped as soon as a
 * non-COD method is selected (PaymentMethods), which also covers a COD
 * attempt that failed before the customer switched to card.
 *
 * Known limitation, accepted: this is same-tab/same-session only. Revisiting
 * the confirmation link later (a different tab, a different device, from
 * the confirmation email) will not show the COD reminder — there's no
 * permission-free way to recover that signal after the fact. Not a wrong
 * answer, just an absent one in that case.
 */
const STORAGE_KEY = "lastPaymentGatewayId";

interface StoredPaymentGateway {
	gatewayId: string;
	// Set once an order confirmation has claimed this marker.
	orderId?: string;
}

const read = (): StoredPaymentGateway | null => {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}
		try {
			const parsed = JSON.parse(raw) as Partial<StoredPaymentGateway>;
			if (parsed && typeof parsed.gatewayId === "string") {
				return { gatewayId: parsed.gatewayId, orderId: parsed.orderId };
			}
		} catch {
			// Plain-string value written by the previous version: it can't tell us
			// which order it belonged to, so treat it as claimed by some other
			// order — an absent reminder beats a wrong one.
		}
		return { gatewayId: raw, orderId: "legacy-unknown-order" };
	} catch {
		return null;
	}
};

const write = (value: StoredPaymentGateway) => {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		// sessionStorage unavailable (private mode, etc.) — the COD reminder
		// just won't show; never let this block payment completion.
	}
};

export function markPaymentGatewayUsed(gatewayId: string): void {
	write({ gatewayId });
}

// Drops a marker no order has claimed yet — called when the customer picks a
// gateway other than the one the marker names.
export function clearUnclaimedPaymentGateway(): void {
	const stored = read();
	if (stored && !stored.orderId) {
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {
			// ignore
		}
	}
}

// The gateway that completed `orderId`, if this tab session recorded one.
// Claims an unclaimed marker for this order; ignores one claimed by another.
export function getPaymentGatewayForOrder(orderId: string): string | null {
	const stored = read();
	if (!stored) {
		return null;
	}
	if (!stored.orderId) {
		write({ ...stored, orderId });
		return stored.gatewayId;
	}
	return stored.orderId === orderId ? stored.gatewayId : null;
}
