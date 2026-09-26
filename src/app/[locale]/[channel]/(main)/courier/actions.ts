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
import { getReturnStatus, readMetadataRaw, RETURN_METADATA_KEYS } from "@/lib/returns/returnMetadata";
import { returnLocale } from "@/lib/returns/returnOrders";
import { withOrderLock } from "@/lib/returns/orderLock";
import { sendReturnItemReceivedEmail } from "@/lib/returns/returnEmails";

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

export type MarkPickedUpResult =
	| { ok: true; emailSent: boolean }
	| {
			ok: false;
			error: "unauthorized" | "not_found" | "not_scheduled" | "already_received" | "config_error";
	  };

/**
 * Courier-gated return pickup. Same re-verify → write → email discipline as
 * markOrderDelivered, inside the shared per-order lock: the order is re-read
 * with the courier app token and must still be returnStatus=pickup_scheduled;
 * the confirmation email is sent once, guarded by returnReceivedEmailSentAt.
 */
export async function markReturnPickedUp(
	orderId: string,
	channel: string,
	locale: string,
): Promise<MarkPickedUpResult> {
	const courier = await resolveCourier();
	if (!courier) return { ok: false, error: "unauthorized" };

	if (!COURIER_APP_TOKEN) {
		console.error("[courier] SALEOR_COURIER_APP_TOKEN is not configured");
		return { ok: false, error: "config_error" };
	}

	const orderUuid = orderGlobalIdToUuid(orderId);
	if (!orderUuid) return { ok: false, error: "not_found" };

	return withOrderLock(orderId, async (): Promise<MarkPickedUpResult> => {
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
			console.error("[courier] failed to re-fetch order for pickup check:", error);
			return { ok: false, error: "not_found" };
		}

		if (!order || order.channel.slug !== channel) {
			return { ok: false, error: "not_found" };
		}

		const status = getReturnStatus(order.metadata);
		const alreadyReceived = status === "item_received" || status === "refunded";
		if (!alreadyReceived && status !== "pickup_scheduled") {
			return { ok: false, error: "not_scheduled" };
		}

		let metadata = order.metadata;
		if (!alreadyReceived) {
			const entries = [
				{ key: RETURN_METADATA_KEYS.status, value: "item_received" },
				{ key: RETURN_METADATA_KEYS.receivedAt, value: new Date().toISOString() },
				{ key: RETURN_METADATA_KEYS.receivedBy, value: courier.userId },
			];
			try {
				const result = await executeGraphQL(CourierUpdateOrderMetadataDocument, {
					variables: { id: order.id, input: entries },
					withAuth: false,
					cache: "no-cache",
					headers: courierAppHeaders(),
				});
				if (result.updateMetadata?.metadataErrors.length) {
					console.error("[courier] updateMetadata returned errors:", result.updateMetadata.metadataErrors);
					return { ok: false, error: "not_scheduled" };
				}
			} catch (error) {
				console.error("[courier] failed to write pickup metadata for order", order.number, error);
				return { ok: false, error: "not_scheduled" };
			}
			metadata = [...metadata, ...entries];

			revalidatePath(`/${locale}/${channel}/courier`);
			revalidatePath(`/${locale}/${channel}/admin/returns`);
			revalidatePath(`/${locale}/${channel}/account`);
			revalidatePath(`/${locale}/${channel}/track-order/[token]`, "page");
		}

		// Send (or, on a repeat tap after a failed send, finish sending) the
		// confirmation exactly once.
		let emailSent = false;
		if (!readMetadataRaw(metadata, RETURN_METADATA_KEYS.receivedEmailSentAt) && order.userEmail) {
			try {
				await sendReturnItemReceivedEmail({
					to: order.userEmail,
					orderNumber: order.number,
					orderUuid,
					locale: returnLocale(metadata, locale),
					channel,
				});
				emailSent = true;
				await executeGraphQL(CourierUpdateOrderMetadataDocument, {
					variables: {
						id: order.id,
						input: [{ key: RETURN_METADATA_KEYS.receivedEmailSentAt, value: new Date().toISOString() }],
					},
					withAuth: false,
					cache: "no-cache",
					headers: courierAppHeaders(),
				});
			} catch (error) {
				console.error("[courier] failed to send/record return-received email for order", order.number, error);
			}
		}

		if (alreadyReceived) return { ok: false, error: "already_received" };
		return { ok: true, emailSent };
	});
}
