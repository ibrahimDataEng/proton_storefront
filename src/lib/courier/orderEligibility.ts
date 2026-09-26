import { OrderStatus } from "@/gql/graphql";

/**
 * Pure, framework-free eligibility rules shared by the worklist page (Phase 2)
 * and the mark-delivered server action's re-check (Phase 3) — kept separate
 * from resolveStage.ts (the customer-facing tracking page's own stage logic)
 * because the two have different jobs: resolveStage resolves a *display*
 * stage for one order a customer already knows about, this decides whether an
 * order belongs in the courier *worklist* / may be marked delivered at all.
 * They read the same metadata contract (deliveryStage, paymentMethod) on
 * purpose — see CLAUDE.md's "Checkout Sub-App" tracking-page-stage-contract
 * note — but are not the same function.
 */

export type OrderMetadataEntry = { key: string; value: string };

export const WORKLIST_STATUSES: readonly OrderStatus[] = [
	OrderStatus.Fulfilled,
	OrderStatus.PartiallyFulfilled,
];

function readMetadataValue(metadata: readonly OrderMetadataEntry[], key: string): string {
	const entry = metadata.find((item) => item.key === key);
	return entry ? entry.value.trim().toLowerCase() : "";
}

export function isMarkedDelivered(metadata: readonly OrderMetadataEntry[]): boolean {
	return readMetadataValue(metadata, "deliveryStage") === "delivered";
}

export function isDeliveredEmailSent(metadata: readonly OrderMetadataEntry[]): boolean {
	return readMetadataValue(metadata, "deliveredEmailSentAt") !== "";
}

export type CourierPaymentMethod = "cod" | "card" | "unknown";

export function detectPaymentMethod(metadata: readonly OrderMetadataEntry[]): CourierPaymentMethod {
	const value = readMetadataValue(metadata, "paymentMethod");
	if (value === "cod") return "cod";
	if (value === "card") return "card";
	return "unknown";
}

/**
 * Money is stored as gross-amount floats from the API; clamp to 0 rather than
 * show a courier a negative "amount to collect" if a refund/discount ever
 * pushes totalCharged above the order total.
 */
export function outstandingAmount(order: { grossAmount: number; chargedAmount: number }): number {
	return Math.max(0, order.grossAmount - order.chargedAmount);
}

/**
 * Whether an order belongs in the courier worklist / may still be marked
 * delivered. The worklist query already filters status server-side
 * (WORKLIST_STATUSES) — this is re-applied here so the mark-delivered action
 * re-checks the exact same rule against a fresh, independent read, never the
 * client-submitted snapshot.
 */
export function isEligibleForDelivery(order: {
	status: OrderStatus;
	metadata: readonly OrderMetadataEntry[];
}): boolean {
	if (!WORKLIST_STATUSES.includes(order.status)) return false;
	if (isMarkedDelivered(order.metadata)) return false;
	return true;
}

/**
 * Order.id is a relay global id, base64("Order:<uuid>") — the tracking page
 * (track-order/[token]/page.tsx) does the inverse encode. Decoding it here is
 * the only way to build a track-order link from an Order object fetched by
 * global id, without a second GraphQL round trip.
 */
export function orderGlobalIdToUuid(globalId: string): string | null {
	try {
		const decoded = Buffer.from(globalId, "base64").toString("utf8");
		const [type, uuid] = decoded.split(":");
		if (type !== "Order" || !uuid) return null;
		return uuid;
	} catch {
		return null;
	}
}
