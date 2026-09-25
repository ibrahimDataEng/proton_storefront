import { RETURN_REASONS, RETURN_STATUSES, type ReturnReason, type ReturnStatus } from "./returnCodes";
import { OrderStatus } from "@/gql/graphql";

export * from "./returnCodes";

/**
 * Pure, framework-free rules for the customer return flow. Everything here reads
 * order PUBLIC metadata (the customer accepted these values are public — see
 * CLAUDE.md's "Returns" metadata contract) and is shared by the account order
 * list (button visibility), every server action's re-check, the admin review
 * page, the courier returns section and the tracking page.
 *
 * Values are stored as short codes, never translated labels; unknown or
 * malformed values always degrade to "no return" rather than throwing.
 */

export type OrderMetadataEntry = { key: string; value: string };

export const RETURN_METADATA_KEYS = {
	status: "returnStatus",
	reason: "returnReason",
	details: "returnDetails",
	requestedAt: "returnRequestedAt",
	locale: "returnLocale",
	requestEmailSentAt: "returnRequestEmailSentAt",
	decidedAt: "returnDecidedAt",
	decidedBy: "returnDecidedBy",
	rejectedReason: "returnRejectedReason",
	rejectedEmailSentAt: "returnRejectedEmailSentAt",
	pickupExpectedAt: "returnPickupExpectedAt",
	pickupEmailSentFor: "returnPickupEmailSentFor",
	receivedAt: "returnReceivedAt",
	receivedBy: "returnReceivedBy",
	receivedEmailSentAt: "returnReceivedEmailSentAt",
	refundedAt: "returnRefundedAt",
	refundedBy: "returnRefundedBy",
} as const;

/** Customers may request a return until deliveredAt + 24h — never measured from order creation. */
export const RETURN_WINDOW_MS = 24 * 60 * 60 * 1000;

export function readMetadataRaw(metadata: readonly OrderMetadataEntry[], key: string): string {
	const entry = metadata.find((item) => item.key === key);
	return entry ? entry.value.trim() : "";
}

export function isReturnReason(value: string): value is ReturnReason {
	return (RETURN_REASONS as readonly string[]).includes(value);
}

export function isReturnStatus(value: string): value is ReturnStatus {
	return (RETURN_STATUSES as readonly string[]).includes(value);
}

/** The order's return status, or null when absent/unrecognized. */
export function getReturnStatus(metadata: readonly OrderMetadataEntry[]): ReturnStatus | null {
	const value = readMetadataRaw(metadata, RETURN_METADATA_KEYS.status).toLowerCase();
	return isReturnStatus(value) ? value : null;
}

/** True when ANY returnStatus value is present, recognized or not — a request can only be opened once. */
export function hasAnyReturnStatus(metadata: readonly OrderMetadataEntry[]): boolean {
	return readMetadataRaw(metadata, RETURN_METADATA_KEYS.status) !== "";
}

export function getReturnReason(metadata: readonly OrderMetadataEntry[]): ReturnReason | null {
	const value = readMetadataRaw(metadata, RETURN_METADATA_KEYS.reason).toLowerCase();
	return isReturnReason(value) ? value : null;
}

/** Parses an ISO timestamp from metadata; null when missing or unparseable. */
export function readMetadataDate(metadata: readonly OrderMetadataEntry[], key: string): Date | null {
	const raw = readMetadataRaw(metadata, key);
	if (!raw) return null;
	const date = new Date(raw);
	return Number.isNaN(date.getTime()) ? null : date;
}

const NOT_RETURNABLE_STATUSES: readonly OrderStatus[] = [
	OrderStatus.Canceled,
	OrderStatus.Expired,
	OrderStatus.Draft,
	OrderStatus.Unconfirmed,
	OrderStatus.Returned,
	OrderStatus.PartiallyReturned,
];

export type ReturnEligibility =
	| { eligible: true; deadline: Date }
	| { eligible: false; reason: "not_eligible" | "not_delivered" | "window_closed" | "already_requested" };

/**
 * Whether a customer may open a return request on this order right now:
 * courier-marked delivered (deliveryStage=delivered), now < deliveredAt + 24h,
 * no returnStatus yet, and the order isn't cancelled/expired/already returned.
 * Used for button visibility AND re-run server-side in the request action
 * against a fresh read — the client's copy is never trusted.
 */
export function getReturnEligibility(
	order: { status: OrderStatus; metadata: readonly OrderMetadataEntry[] },
	now: Date,
): ReturnEligibility {
	if (NOT_RETURNABLE_STATUSES.includes(order.status)) {
		return { eligible: false, reason: "not_eligible" };
	}
	if (hasAnyReturnStatus(order.metadata)) {
		return { eligible: false, reason: "already_requested" };
	}
	if (readMetadataRaw(order.metadata, "deliveryStage").toLowerCase() !== "delivered") {
		return { eligible: false, reason: "not_delivered" };
	}
	const deliveredAt = readMetadataDate(order.metadata, "deliveredAt");
	if (!deliveredAt) {
		return { eligible: false, reason: "not_delivered" };
	}
	const deadline = new Date(deliveredAt.getTime() + RETURN_WINDOW_MS);
	if (now.getTime() >= deadline.getTime()) {
		return { eligible: false, reason: "window_closed" };
	}
	return { eligible: true, deadline };
}

/* ------------------------------------------------------------------------- */
/* Pickup time                                                                */
/* ------------------------------------------------------------------------- */

/**
 * The owner enters the pickup time with a native <input type="datetime-local">
 * (phone-native picker in both locales, no library). Its value is a
 * timezone-less wall-clock string "YYYY-MM-DDTHH:mm", which is always
 * interpreted as UAE time — this store only delivers in the UAE, and the UAE
 * has a fixed UTC+4 offset with no DST (same assumption src/lib/delivery.ts
 * already makes). It's stored as an ISO 8601 UTC instant (the same format as
 * deliveredAt), and always DISPLAYED in Asia/Dubai, so an owner, a courier and a
 * customer all see the same wall-clock time regardless of their device's zone.
 */
export const UAE_TIME_ZONE = "Asia/Dubai";
const UAE_OFFSET = "+04:00";
const UAE_OFFSET_MS = 4 * 60 * 60 * 1000;

const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Max distance into the future a pickup may be scheduled. */
export const PICKUP_MAX_AHEAD_MS = 30 * 24 * 60 * 60 * 1000;
/** Tolerance for "in the past" — the form may sit open for a few minutes. */
export const PICKUP_PAST_TOLERANCE_MS = 15 * 60 * 1000;

export type PickupParseResult =
	| { ok: true; iso: string }
	| { ok: false; error: "invalid" | "past" | "too_far" };

export function parseUaePickupInput(value: string, now: Date): PickupParseResult {
	const match = LOCAL_DATETIME_PATTERN.exec(value.trim());
	if (!match) return { ok: false, error: "invalid" };
	const [, year, month, day, hour, minute] = match;
	const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00${UAE_OFFSET}`);
	if (Number.isNaN(date.getTime())) return { ok: false, error: "invalid" };
	// Reject values the Date constructor silently normalizes (e.g. Feb 31).
	const roundTrip = toUaeDateTimeLocalValue(date);
	if (roundTrip !== `${year}-${month}-${day}T${hour}:${minute}`) return { ok: false, error: "invalid" };
	if (date.getTime() < now.getTime() - PICKUP_PAST_TOLERANCE_MS) return { ok: false, error: "past" };
	if (date.getTime() > now.getTime() + PICKUP_MAX_AHEAD_MS) return { ok: false, error: "too_far" };
	return { ok: true, iso: date.toISOString() };
}

/** "YYYY-MM-DDTHH:mm" in UAE wall-clock time — for a datetime-local's value/min/max. */
export function toUaeDateTimeLocalValue(date: Date): string {
	return new Date(date.getTime() + UAE_OFFSET_MS).toISOString().slice(0, 16);
}

/** Human-readable UAE time, e.g. "Thursday, 24 September 2026 at 10:30 AM". */
export function formatUaeDateTime(date: Date, locale: string): string {
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", {
		timeZone: UAE_TIME_ZONE,
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}
