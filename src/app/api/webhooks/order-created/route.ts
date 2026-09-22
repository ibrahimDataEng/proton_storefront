import { NextResponse, type NextRequest } from "next/server";
import { transporter } from "@/lib/mailer";
import { verifyWebhookSignature } from "@/lib/verifyWebhookSignature";
import { OPS_NOTIFICATION_EMAIL } from "@/lib/email/opsAddress";

const CONTACT_TO = OPS_NOTIFICATION_EMAIL;

interface OrderCreatedAddress {
	firstName?: string;
	lastName?: string;
	streetAddress1?: string;
	streetAddress2?: string;
	city?: string;
	countryArea?: string;
	country?: { country?: string };
	phone?: string;
}

interface OrderCreatedLine {
	productName?: string;
	variantName?: string;
	quantity?: number;
	unitPrice?: { gross?: { amount?: number; currency?: string } };
}

interface OrderCreatedPayload {
	order?: {
		id?: string;
		number?: string;
		created?: string;
		total?: { gross?: { amount?: number; currency?: string } };
		userEmail?: string;
		shippingAddress?: OrderCreatedAddress;
		lines?: OrderCreatedLine[];
	};
}

function formatAddress(address: OrderCreatedAddress | undefined): string {
	if (!address) return "(no shipping address)";
	const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
	const lines = [
		name,
		[address.streetAddress1, address.streetAddress2].filter(Boolean).join(", "),
		[address.city, address.countryArea].filter(Boolean).join(", "),
		address.country?.country,
		address.phone,
	].filter(Boolean);
	return lines.join("\n");
}

function formatLines(lines: OrderCreatedLine[] | undefined): string {
	if (!lines?.length) return "(no line items)";
	return lines
		.map((line) => {
			const name = [line.productName, line.variantName].filter(Boolean).join(" — ");
			const price = line.unitPrice?.gross;
			const priceText = price?.amount != null ? `${price.amount.toFixed(2)} ${price.currency ?? ""}` : "";
			return `  • ${name} × ${line.quantity ?? "?"} (${priceText} each)`;
		})
		.join("\n");
}

// This is an internal ops notification, always in English regardless of the
// storefront locale the order was placed in — same precedent as Session 34's
// account-deletion-feedback email.
export async function POST(request: NextRequest) {
	const rawBody = await request.text();
	const signature = request.headers.get("Saleor-Signature");

	if (!verifyWebhookSignature(Buffer.from(rawBody, "utf8"), signature, process.env.ORDER_WEBHOOK_SECRET)) {
		return NextResponse.json({ error: "invalid signature" }, { status: 401 });
	}

	let payload: OrderCreatedPayload;
	try {
		payload = JSON.parse(rawBody) as OrderCreatedPayload;
	} catch {
		return NextResponse.json({ error: "invalid body" }, { status: 400 });
	}

	const order = payload.order;
	if (!order) {
		// Acknowledge anyway — a malformed/unexpected payload must never make
		// Saleor treat this as a delivery failure and retry indefinitely.
		console.error("[order-created webhook] payload had no order object");
		return NextResponse.json({ status: "accepted" }, { status: 200 });
	}

	const total = order.total?.gross?.amount;
	const customerEmail = order.userEmail ?? "(no email on order)";

	// Fire-and-forget on purpose: Saleor's retry-on-non-200 behavior is about
	// whether the webhook *delivery* succeeded, not whether the follow-up email
	// send succeeded — those are separate concerns. A slow/failed email must
	// never turn into a 5xx here, or Saleor would keep redelivering the same
	// event for an unrelated SMTP problem. Failures are logged so they're
	// actually noticed via server logs, not silently lost.
	transporter
		.sendMail({
			from: `"Tawasi Plus Orders" <info@tawasiplus.com>`,
			to: CONTACT_TO,
			subject: `New Order #${order.number ?? "?"} — AED ${total != null ? total.toFixed(2) : "?"}`,
			text: [
				`New order placed.`,
				``,
				`Order: #${order.number ?? "?"}`,
				`Placed: ${order.created ?? "?"}`,
				`Total: ${total != null ? total.toFixed(2) : "?"} ${order.total?.gross?.currency ?? "AED"}`,
				``,
				`Customer email: ${customerEmail}`,
				``,
				`Shipping address:`,
				formatAddress(order.shippingAddress),
				``,
				`Items:`,
				formatLines(order.lines),
			].join("\n"),
		})
		.catch((err) => {
			console.error(`[order-created webhook] failed to send notification for order #${order.number}:`, err);
		});

	return NextResponse.json({ status: "accepted" }, { status: 200 });
}
