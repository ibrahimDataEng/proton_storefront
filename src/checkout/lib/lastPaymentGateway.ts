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
 * Known limitation, accepted: this is same-tab/same-session only. Revisiting
 * the confirmation link later (a different tab, a different device, from
 * the confirmation email) will not show the COD reminder — there's no
 * permission-free way to recover that signal after the fact. Not a wrong
 * answer, just an absent one in that case.
 */
const STORAGE_KEY = "lastPaymentGatewayId";

export function markPaymentGatewayUsed(gatewayId: string): void {
	try {
		sessionStorage.setItem(STORAGE_KEY, gatewayId);
	} catch {
		// sessionStorage unavailable (private mode, etc.) — the COD reminder
		// just won't show; never let this block payment completion.
	}
}

export function getLastPaymentGatewayId(): string | null {
	try {
		return sessionStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}
