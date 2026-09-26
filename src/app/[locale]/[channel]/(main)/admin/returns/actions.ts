"use server";

import { revalidatePath } from "next/cache";
import { resolveAdmin } from "@/lib/admin";
import { orderGlobalIdToUuid } from "@/lib/courier/orderEligibility";
import {
	getReturnStatus,
	parseUaePickupInput,
	readMetadataRaw,
	REJECTION_NOTE_MAX_LENGTH,
	RETURN_METADATA_KEYS,
} from "@/lib/returns/returnMetadata";
import {
	fetchOrderForReturn,
	getReturnsAppToken,
	returnLocale,
	writeOrderMetadata,
} from "@/lib/returns/returnOrders";
import { withOrderLock } from "@/lib/returns/orderLock";
import { sendReturnPickupScheduledEmail, sendReturnRejectedEmail } from "@/lib/returns/returnEmails";
import { type ReturnOrderFragment } from "@/gql/graphql";

export type AdminReturnError =
	| "unauthorized"
	| "not_found"
	| "invalid_state"
	| "note_required"
	| "pickup_invalid"
	| "pickup_past"
	| "pickup_too_far"
	| "refund_not_recorded"
	| "config_error"
	| "unknown";

export type AdminReturnResult = { ok: true; emailSent: boolean } | { ok: false; error: AdminReturnError };

type LoadedOrder = { order: ReturnOrderFragment; orderUuid: string; appToken: string };

/**
 * Shared prelude for every admin action: admin gate (re-checked per action),
 * app token, then — inside the per-order lock — a fresh read of the order.
 * The action body re-verifies the return state against that read before any
 * write; nothing the admin page rendered is trusted.
 */
async function withAdminOrder(
	orderId: string,
	channel: string,
	body: (loaded: LoadedOrder & { adminId: string }) => Promise<AdminReturnResult>,
): Promise<AdminReturnResult> {
	const admin = await resolveAdmin();
	if (!admin) return { ok: false, error: "unauthorized" };

	const appToken = getReturnsAppToken();
	if (!appToken) {
		console.error("[returns-admin] SALEOR_RETURNS_APP_TOKEN is not configured");
		return { ok: false, error: "config_error" };
	}

	const orderUuid = orderGlobalIdToUuid(orderId);
	if (!orderUuid) return { ok: false, error: "not_found" };

	return withOrderLock(orderId, async () => {
		let order: ReturnOrderFragment | null;
		try {
			order = await fetchOrderForReturn(orderId, appToken);
		} catch (error) {
			console.error("[returns-admin] failed to re-fetch order:", error);
			return { ok: false, error: "not_found" };
		}
		if (!order || order.channel.slug !== channel) return { ok: false, error: "not_found" };
		return body({ order, orderUuid, appToken, adminId: admin.userId });
	});
}

function customerEmail(order: ReturnOrderFragment): string | null {
	return order.userEmail || order.user?.email || null;
}

function revalidateReturnViews(locale: string, channel: string, orderUuid: string) {
	revalidatePath(`/${locale}/${channel}/admin/returns`);
	revalidatePath(`/${locale}/${channel}/admin/returns/${orderUuid}`);
	revalidatePath(`/${locale}/${channel}/courier`);
	revalidatePath(`/${locale}/${channel}/account`);
	revalidatePath(`/${locale}/${channel}/track-order/[token]`, "page");
}

/** Sends the rejection email once; records returnRejectedEmailSentAt only after a successful send. */
async function sendRejectionOnce(
	{ order, orderUuid, appToken }: LoadedOrder,
	locale: string,
): Promise<boolean> {
	if (readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.rejectedEmailSentAt)) return true;
	const to = customerEmail(order);
	const note = readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.rejectedReason);
	if (!to || !note) return false;
	try {
		await sendReturnRejectedEmail({
			to,
			orderNumber: order.number,
			orderUuid,
			locale: returnLocale(order.metadata, locale),
			channel: order.channel.slug,
			note,
		});
		await writeOrderMetadata(
			order.id,
			[{ key: RETURN_METADATA_KEYS.rejectedEmailSentAt, value: new Date().toISOString() }],
			appToken,
		);
		return true;
	} catch (error) {
		console.error("[returns-admin] failed to send rejection email for order", order.number, error);
		return false;
	}
}

/**
 * Sends the pickup email once per pickup time: the marker stores the pickup
 * ISO it was sent for, so re-submitting the same time never re-sends, while a
 * genuine reschedule (a new time) sends exactly one new email.
 */
async function sendPickupOnce(
	{ order, orderUuid, appToken }: LoadedOrder,
	locale: string,
	pickupIso: string,
	isReschedule: boolean,
): Promise<boolean> {
	if (readMetadataRaw(order.metadata, RETURN_METADATA_KEYS.pickupEmailSentFor) === pickupIso) return true;
	const to = customerEmail(order);
	if (!to) return false;
	try {
		await sendReturnPickupScheduledEmail({
			to,
			orderNumber: order.number,
			orderUuid,
			locale: returnLocale(order.metadata, locale),
			channel: order.channel.slug,
			pickupAt: new Date(pickupIso),
			isReschedule,
		});
		await writeOrderMetadata(
			order.id,
			[{ key: RETURN_METADATA_KEYS.pickupEmailSentFor, value: pickupIso }],
			appToken,
		);
		return true;
	} catch (error) {
		console.error("[returns-admin] failed to send pickup email for order", order.number, error);
		return false;
	}
}

export async function rejectReturnRequest(input: {
	orderId: string;
	note: string;
	locale: string;
	channel: string;
}): Promise<AdminReturnResult> {
	const note = input.note.trim();
	if (!note || note.length > REJECTION_NOTE_MAX_LENGTH) return { ok: false, error: "note_required" };

	return withAdminOrder(input.orderId, input.channel, async (loaded) => {
		const status = getReturnStatus(loaded.order.metadata);

		if (status === "rejected") {
			// Already decided (double submit, second tab). Never re-write, but
			// finish the email if the first attempt's send failed.
			await sendRejectionOnce(loaded, input.locale);
			return { ok: false, error: "invalid_state" };
		}
		if (status !== "requested") return { ok: false, error: "invalid_state" };

		const now = new Date().toISOString();
		const entries = [
			{ key: RETURN_METADATA_KEYS.status, value: "rejected" },
			{ key: RETURN_METADATA_KEYS.rejectedReason, value: note },
			{ key: RETURN_METADATA_KEYS.decidedAt, value: now },
			{ key: RETURN_METADATA_KEYS.decidedBy, value: loaded.adminId },
		];
		if (!(await writeOrderMetadata(loaded.order.id, entries, loaded.appToken))) {
			return { ok: false, error: "unknown" };
		}
		revalidateReturnViews(input.locale, input.channel, loaded.orderUuid);

		const emailSent = await sendRejectionOnce(
			{ ...loaded, order: { ...loaded.order, metadata: [...loaded.order.metadata, ...entries] } },
			input.locale,
		);
		return { ok: true, emailSent };
	});
}

/**
 * Approve a requested return and schedule the pickup — or, on an order already
 * at pickup_scheduled, move the pickup to a new time (e.g. the customer asked
 * to reschedule). Re-submitting the time already stored is a no-op.
 */
export async function scheduleReturnPickup(input: {
	orderId: string;
	pickupAt: string;
	locale: string;
	channel: string;
}): Promise<AdminReturnResult> {
	const parsed = parseUaePickupInput(input.pickupAt, new Date());
	if (!parsed.ok) return { ok: false, error: `pickup_${parsed.error}` };

	return withAdminOrder(input.orderId, input.channel, async (loaded) => {
		const status = getReturnStatus(loaded.order.metadata);
		if (status !== "requested" && status !== "pickup_scheduled") {
			return { ok: false, error: "invalid_state" };
		}
		const isReschedule = status === "pickup_scheduled";
		const previousIso = readMetadataRaw(loaded.order.metadata, RETURN_METADATA_KEYS.pickupExpectedAt);

		let metadata = loaded.order.metadata;
		if (!isReschedule || previousIso !== parsed.iso) {
			const entries = [
				{ key: RETURN_METADATA_KEYS.status, value: "pickup_scheduled" },
				{ key: RETURN_METADATA_KEYS.pickupExpectedAt, value: parsed.iso },
				{ key: RETURN_METADATA_KEYS.decidedAt, value: new Date().toISOString() },
				{ key: RETURN_METADATA_KEYS.decidedBy, value: loaded.adminId },
			];
			if (!(await writeOrderMetadata(loaded.order.id, entries, loaded.appToken))) {
				return { ok: false, error: "unknown" };
			}
			metadata = [...metadata.filter((item) => !entries.some((e) => e.key === item.key)), ...entries];
			revalidateReturnViews(input.locale, input.channel, loaded.orderUuid);
		}

		const emailSent = await sendPickupOnce(
			{ ...loaded, order: { ...loaded.order, metadata } },
			input.locale,
			parsed.iso,
			isReschedule,
		);
		return { ok: true, emailSent };
	});
}

/**
 * Records that the owner has refunded the order in the Saleor Dashboard, so
 * the tracking page can show "Refunded" without the page ever needing a token.
 * Triggers nothing in Saleor and sends no email (Saleor sends its own refund
 * email). Refused unless Saleor itself already shows a refunded amount.
 */
export async function markReturnRefunded(input: {
	orderId: string;
	locale: string;
	channel: string;
}): Promise<AdminReturnResult> {
	return withAdminOrder(input.orderId, input.channel, async (loaded) => {
		if (getReturnStatus(loaded.order.metadata) !== "item_received") {
			return { ok: false, error: "invalid_state" };
		}
		if (loaded.order.totalRefunded.amount <= 0) {
			return { ok: false, error: "refund_not_recorded" };
		}
		const entries = [
			{ key: RETURN_METADATA_KEYS.status, value: "refunded" },
			{ key: RETURN_METADATA_KEYS.refundedAt, value: new Date().toISOString() },
			{ key: RETURN_METADATA_KEYS.refundedBy, value: loaded.adminId },
		];
		if (!(await writeOrderMetadata(loaded.order.id, entries, loaded.appToken))) {
			return { ok: false, error: "unknown" };
		}
		revalidateReturnViews(input.locale, input.channel, loaded.orderUuid);
		return { ok: true, emailSent: false };
	});
}
