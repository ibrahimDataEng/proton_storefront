"use server";

import { revalidatePath } from "next/cache";
import { resolveAuthenticatedUser } from "@/lib/identity";
import { orderGlobalIdToUuid } from "@/lib/courier/orderEligibility";
import {
	getReturnEligibility,
	getReturnReason,
	getReturnStatus,
	isReturnReason,
	readMetadataRaw,
	RETURN_DETAILS_MAX_LENGTH,
	RETURN_METADATA_KEYS,
} from "@/lib/returns/returnMetadata";
import { fetchOrderForReturn, getReturnsAppToken, writeOrderMetadata } from "@/lib/returns/returnOrders";
import { type ReturnOrderFragment } from "@/gql/graphql";
import { withOrderLock } from "@/lib/returns/orderLock";
import { sendReturnRequestedOwnerEmail } from "@/lib/returns/returnEmails";

export type RequestReturnResult =
	| { ok: true }
	| {
			ok: false;
			error:
				| "unauthorized"
				| "not_found"
				| "not_eligible"
				| "not_delivered"
				| "window_closed"
				| "already_requested"
				| "invalid_input"
				| "config_error"
				| "unknown";
	  };

/**
 * Owner notification, sent at most once per order: skipped when
 * returnRequestEmailSentAt is already recorded, and that marker is written only
 * after a successful send. Failure never rolls back the request itself.
 */
async function notifyOwnerOnce(
	order: ReturnOrderFragment,
	orderUuid: string,
	appToken: string,
	fallbackEmail: string,
): Promise<void> {
	if (readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.requestEmailSentAt)) return;
	const reason = getReturnReason(order.metadata);
	if (!reason) return;

	const address = order.shippingAddress;
	const customerName =
		[order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
		[address?.firstName, address?.lastName].filter(Boolean).join(" ");

	try {
		await sendReturnRequestedOwnerEmail({
			orderNumber: order.number,
			orderUuid,
			channel: order.channel.slug,
			customerName,
			customerEmail: order.userEmail || order.user?.email || fallbackEmail,
			customerPhone: address?.phone || null,
			reason,
			details: readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.details),
			requestedAt: new Date(readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.requestedAt) || Date.now()),
		});
		await writeOrderMetadata(
			order.id,
			[{ key: RETURN_METADATA_KEYS.requestEmailSentAt, value: new Date().toISOString() }],
			appToken,
		);
	} catch (error) {
		console.error("[returns] failed to send owner notification for order", order.number, error);
	}
}

/**
 * Customer-initiated return request. Everything the account page showed is
 * re-verified here against a fresh read with the app token — the client's
 * order id, eligibility and window are never trusted:
 *   - the caller's identity comes from their own session cookie (me { id });
 *   - the order must belong to that user (Order.user.id === me.id) — an id for
 *     someone else's order gets the same not_found as a nonexistent one;
 *   - delivered (deliveryStage=delivered), now < deliveredAt + 24h, no
 *     returnStatus yet, not cancelled/returned.
 */
export async function requestOrderReturn(input: {
	orderId: string;
	reason: string;
	details: string;
	locale: string;
	channel: string;
}): Promise<RequestReturnResult> {
	const reason = input.reason.trim();
	const details = input.details.trim();
	if (!isReturnReason(reason)) return { ok: false, error: "invalid_input" };
	if (reason === "other" && !details) return { ok: false, error: "invalid_input" };
	if (details.length > RETURN_DETAILS_MAX_LENGTH) return { ok: false, error: "invalid_input" };
	const locale = input.locale === "ar" ? "ar" : "en";

	const caller = await resolveAuthenticatedUser();
	if (!caller) return { ok: false, error: "unauthorized" };

	const appToken = getReturnsAppToken();
	if (!appToken) {
		console.error("[returns] SALEOR_RETURNS_APP_TOKEN is not configured");
		return { ok: false, error: "config_error" };
	}

	const orderUuid = orderGlobalIdToUuid(input.orderId);
	if (!orderUuid) return { ok: false, error: "not_found" };

	return withOrderLock(input.orderId, async (): Promise<RequestReturnResult> => {
		let order: ReturnOrderFragment | null;
		try {
			order = await fetchOrderForReturn(input.orderId, appToken);
		} catch (error) {
			console.error("[returns] failed to re-fetch order for return request:", error);
			return { ok: false, error: "not_found" };
		}

		// Ownership: guest orders (user null) and other customers' orders are
		// indistinguishable from a nonexistent id to the caller.
		if (!order || order.channel.slug !== input.channel || order.user?.id !== caller.userId) {
			return { ok: false, error: "not_found" };
		}

		// Already requested (e.g. a double submit that lost the race to the
		// lock): refuse, but finish a pending owner email if the first attempt's
		// send failed.
		if (getReturnStatus(order.metadata) === "requested") {
			await notifyOwnerOnce(order, orderUuid, appToken, order.user.email);
			return { ok: false, error: "already_requested" };
		}

		const eligibility = getReturnEligibility(order, new Date());
		if (!eligibility.eligible) return { ok: false, error: eligibility.reason };

		const requestedAt = new Date().toISOString();
		const entries: { key: string; value: string }[] = [
			{ key: RETURN_METADATA_KEYS.status, value: "requested" },
			{ key: RETURN_METADATA_KEYS.reason, value: reason },
			{ key: RETURN_METADATA_KEYS.requestedAt, value: requestedAt },
			{ key: RETURN_METADATA_KEYS.locale, value: locale },
		];
		if (details) entries.push({ key: RETURN_METADATA_KEYS.details, value: details });

		const written = await writeOrderMetadata(order.id, entries, appToken);
		if (!written) return { ok: false, error: "unknown" };

		revalidatePath(`/${input.locale}/${input.channel}/account`);
		revalidatePath(`/${input.locale}/${input.channel}/track-order/[token]`, "page");

		await notifyOwnerOnce(
			{ ...order, metadata: [...order.metadata, ...entries] },
			orderUuid,
			appToken,
			order.user.email,
		);

		return { ok: true };
	});
}
