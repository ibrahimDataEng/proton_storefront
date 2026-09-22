"use server";

import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { CourierOrderEligibilityDocument, CourierUpdateOrderMetadataDocument } from "@/gql/graphql";
import { resolveCourier } from "@/lib/courier";
import {
	detectPaymentMethod,
	isDeliveredEmailSent,
	isEligibleForDelivery,
	isMarkedDelivered,
	orderGlobalIdToUuid,
	outstandingAmount,
} from "@/lib/courier/orderEligibility";
import { sendOrderDeliveredEmail } from "@/lib/courier/deliveredEmail";

const COURIER_APP_TOKEN = process.env.SALEOR_COURIER_APP_TOKEN;

function courierAppHeaders(): Record<string, string> {
	if (!COURIER_APP_TOKEN) {
		throw new Error("SALEOR_COURIER_APP_TOKEN is not configured");
	}
	return { Authorization: `Bearer ${COURIER_APP_TOKEN}` };
}

export type MarkDeliveredResult =
	| { ok: true; emailSent: boolean }
	| {
			ok: false;
			error: "unauthorized" | "not_found" | "not_eligible" | "already_delivered" | "config_error";
	  };

/**
 * Courier-gated, per-order. Re-fetches and re-verifies the order with the
 * server-side app token before writing anything — never trusts the order id
 * on its own, since a worklist snapshot in the browser can be stale or
 * (tampering case) an id for an order the caller was never shown at all. An
 * email failure never rolls back the delivery mark; it's logged and reported
 * back to the caller as a non-blocking notice via `emailSent: false`.
 */
export async function markOrderDelivered(
	orderId: string,
	channel: string,
	locale: string,
): Promise<MarkDeliveredResult> {
	const courier = await resolveCourier();
	if (!courier) return { ok: false, error: "unauthorized" };

	if (!COURIER_APP_TOKEN) {
		console.error("[courier] SALEOR_COURIER_APP_TOKEN is not configured");
		return { ok: false, error: "config_error" };
	}

	let order;
	try {
		const data = await executeGraphQL(CourierOrderEligibilityDocument, {
			variables: { id: orderId },
			withAuth: false,
			cache: "no-cache",
			headers: courierAppHeaders(),
		});
		order = data.order;
	} catch (error) {
		console.error("[courier] failed to re-fetch order for eligibility check:", error);
		return { ok: false, error: "not_found" };
	}

	if (!order || order.channel.slug !== channel) {
		return { ok: false, error: "not_found" };
	}

	if (isMarkedDelivered(order.metadata)) {
		return { ok: false, error: "already_delivered" };
	}

	if (!isEligibleForDelivery(order)) {
		return { ok: false, error: "not_eligible" };
	}

	const deliveredAt = new Date().toISOString();

	try {
		const result = await executeGraphQL(CourierUpdateOrderMetadataDocument, {
			variables: {
				id: order.id,
				input: [
					{ key: "deliveryStage", value: "delivered" },
					{ key: "deliveredAt", value: deliveredAt },
					{ key: "deliveredBy", value: courier.userId },
				],
			},
			withAuth: false,
			cache: "no-cache",
			headers: courierAppHeaders(),
		});
		if (result.updateMetadata?.metadataErrors.length) {
			console.error("[courier] updateMetadata returned errors:", result.updateMetadata.metadataErrors);
			return { ok: false, error: "not_eligible" };
		}
	} catch (error) {
		console.error("[courier] failed to write delivered metadata for order", order.number, error);
		return { ok: false, error: "not_eligible" };
	}

	revalidatePath(`/${locale}/${channel}/courier`);
	revalidatePath(`/${locale}/${channel}/track-order/[token]`, "page");

	let emailSent = false;
	if (!isDeliveredEmailSent(order.metadata) && order.userEmail) {
		const orderUuid = orderGlobalIdToUuid(order.id);
		if (orderUuid) {
			try {
				await sendOrderDeliveredEmail({
					to: order.userEmail,
					orderNumber: order.number,
					orderUuid,
					locale,
					channel,
					paymentMethod: detectPaymentMethod(order.metadata),
					codAmount: outstandingAmount({
						grossAmount: order.total.gross.amount,
						chargedAmount: order.totalCharged.amount,
					}),
					currency: order.total.gross.currency,
				});
				emailSent = true;

				await executeGraphQL(CourierUpdateOrderMetadataDocument, {
					variables: {
						id: order.id,
						input: [{ key: "deliveredEmailSentAt", value: new Date().toISOString() }],
					},
					withAuth: false,
					cache: "no-cache",
					headers: courierAppHeaders(),
				});
			} catch (error) {
				console.error("[courier] failed to send/record delivered email for order", order.number, error);
			}
		}
	}

	return { ok: true, emailSent };
}
