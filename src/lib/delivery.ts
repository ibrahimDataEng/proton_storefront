/**
 * UAE time = UTC+4 (no DST).
 * Delivery cutoff: 08:00–20:00 UAE → next-day delivery; 20:00–08:00 UAE →
 * delivery in 2 days (Session 39).
 * Window 08:00–19:59 UAE → deliver TOMORROW  (count to 20:00 UAE = 16:00 UTC)
 * Window 20:00–07:59 UAE → deliver DAY AFTER (count to next 08:00 UAE = 04:00 UTC)
 *
 * Framework-agnostic — shared between CheckoutCountdown (always evaluated
 * against "now") and OrderConfirmation (evaluated against the order's own
 * creation time, so a customer revisiting later still sees the delivery
 * promise made at the moment they actually ordered).
 */
export type DeliveryLabel = "tomorrow" | "dayAfterTomorrow";

export interface DeliveryInfo {
	label: DeliveryLabel;
	targetMs: number;
}

export function getDeliveryInfo(referenceTime: Date = new Date()): DeliveryInfo {
	const now = referenceTime;
	const uaeHour = (now.getUTCHours() + 4) % 24;

	if (uaeHour >= 8 && uaeHour < 20) {
		// Inside same-day window → count down to 20:00 UAE (16:00 UTC)
		const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16, 0, 0, 0));
		if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
		return { label: "tomorrow", targetMs: target.getTime() };
	} else {
		// Outside window → count down to next 08:00 UAE (04:00 UTC)
		const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 0, 0, 0));
		if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
		return { label: "dayAfterTomorrow", targetMs: target.getTime() };
	}
}
