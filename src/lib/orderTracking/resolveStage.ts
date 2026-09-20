import { FulfillmentStatus, OrderChargeStatusEnum, OrderStatus } from "@/gql/graphql";

/**
 * Pure stage-resolution function for the order-tracking page — deliberately
 * has no knowledge of GraphQL/fetching, so it can be unit tested against
 * plain fixture objects.
 *
 * Four customer-visible stages:
 *   1. Order placed     — automatic, floor for any live order
 *   2. Preparing         — automatic, Order.status past DRAFT/UNCONFIRMED
 *   3. Out for delivery  — manual, order public metadata `deliveryStage`
 *   4. Delivered         — COD: automatic once chargeStatus is FULL (the
 *                          Capture button, live in production); Stripe: manual,
 *                          via the same `deliveryStage` metadata value
 *
 * Gateway detection (needed because chargeStatus FULL means "cash collected
 * at delivery" for COD but just "charged at checkout" for Stripe — the two
 * are NOT distinguishable from chargeStatus/authorizeStatus alone once both
 * are FULL, since Saleor's update_order_authorize_status folds authorized and
 * charged amounts together) comes from order public metadata key
 * `paymentMethod` ("cod" | "card"), stamped by proton_payments at
 * TRANSACTION_INITIALIZE_SESSION time and copied onto the order verbatim at
 * checkoutComplete. An absent/unrecognized value degrades to "unknown" —
 * the automatic COD rule simply doesn't fire; the order still reaches stage 4
 * via the manual metadata value, same as Stripe.
 */

export type OrderTrackingStage = 1 | 2 | 3 | 4;

export type ResolvedStage =
	| { kind: "cancelled" }
	| { kind: "returned" }
	| { kind: "progress"; stage: OrderTrackingStage };

export interface StageResolutionInput {
	status: OrderStatus;
	chargeStatus: OrderChargeStatusEnum;
	metadata: readonly { key: string; value: string }[];
	fulfillments: readonly { status: FulfillmentStatus }[];
}

const CANCELLED_STATUSES: readonly OrderStatus[] = [OrderStatus.Canceled, OrderStatus.Expired];
const RETURNED_STATUSES: readonly OrderStatus[] = [OrderStatus.Returned, OrderStatus.PartiallyReturned];
const RETURNED_FULFILLMENT_STATUSES: readonly FulfillmentStatus[] = [
	FulfillmentStatus.Returned,
	FulfillmentStatus.Refunded,
	FulfillmentStatus.RefundedAndReturned,
];
const NOT_YET_PLACED_STATUSES: readonly OrderStatus[] = [OrderStatus.Draft, OrderStatus.Unconfirmed];

function readMetadataValue(metadata: readonly { key: string; value: string }[], key: string): string {
	const entry = metadata.find((item) => item.key === key);
	return entry ? entry.value.trim().toLowerCase() : "";
}

function detectPaymentMethod(
	metadata: readonly { key: string; value: string }[],
): "cod" | "card" | "unknown" {
	const value = readMetadataValue(metadata, "paymentMethod");
	if (value === "cod") return "cod";
	if (value === "card") return "card";
	return "unknown";
}

export function resolveStage(order: StageResolutionInput): ResolvedStage {
	if (CANCELLED_STATUSES.includes(order.status)) {
		return { kind: "cancelled" };
	}
	if (
		RETURNED_STATUSES.includes(order.status) ||
		order.fulfillments.some((fulfillment) => RETURNED_FULFILLMENT_STATUSES.includes(fulfillment.status))
	) {
		return { kind: "returned" };
	}

	let stage: OrderTrackingStage = 1;

	if (!NOT_YET_PLACED_STATUSES.includes(order.status)) {
		stage = Math.max(stage, 2) as OrderTrackingStage;
	}

	const deliveryStage = readMetadataValue(order.metadata, "deliveryStage");
	if (deliveryStage === "out_for_delivery") {
		stage = Math.max(stage, 3) as OrderTrackingStage;
	} else if (deliveryStage === "delivered") {
		stage = Math.max(stage, 4) as OrderTrackingStage;
	}
	// Any other value — missing, misspelled, or stale — is silently ignored;
	// `stage` simply keeps whatever it already reached above.

	const paymentMethod = detectPaymentMethod(order.metadata);
	if (paymentMethod === "cod" && order.chargeStatus === OrderChargeStatusEnum.Full) {
		stage = Math.max(stage, 4) as OrderTrackingStage;
	}

	return { kind: "progress", stage };
}
