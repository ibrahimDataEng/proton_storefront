import { getTranslations } from "next-intl/server";
import { type ReturnReason, formatUaeDateTime } from "./returnMetadata";
import { transporter } from "@/lib/mailer";
import { renderBilingualOrderEmail, escapeHtml } from "@/lib/email/bilingualOrderEmail";
import { OPS_NOTIFICATION_EMAIL, storefrontOrigin } from "@/lib/email/opsAddress";

/**
 * Return-flow emails — all bilingual (Arabic block first, formal MSA), all
 * rendered through renderBilingualOrderEmail. Like sendOrderDeliveredEmail,
 * these have no knowledge of "already sent": the calling server action checks
 * and records the per-transition *EmailSentAt/For metadata marker.
 */

const FROM = `"Tawasi Plus" <info@tawasiplus.com>`;

/** Reason labels come from the same next-intl messages the UI uses — one source of truth per language. */
async function reasonLabels(reason: ReturnReason | null): Promise<{ ar: string; en: string }> {
	if (!reason) return { ar: "—", en: "—" };
	const [tAr, tEn] = await Promise.all([
		getTranslations({ locale: "ar", namespace: "account.returnReasons" }),
		getTranslations({ locale: "en", namespace: "account.returnReasons" }),
	]);
	return { ar: tAr(reason), en: tEn(reason) };
}

function trackingUrl(locale: string, channel: string, orderUuid: string): string {
	return `${storefrontOrigin()}/${locale}/${channel}/track-order/${orderUuid}`;
}

function multiline(value: string): string {
	return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export async function sendReturnRequestedOwnerEmail(input: {
	orderNumber: string;
	orderUuid: string;
	channel: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string | null;
	reason: ReturnReason;
	details: string;
	requestedAt: Date;
}): Promise<void> {
	const labels = await reasonLabels(input.reason);
	// The admin page is reachable in either language; the English route is used
	// for the button since the rest of the ops mail (order-created) is English.
	const adminUrl = `${storefrontOrigin()}/en/${input.channel}/admin/returns/${input.orderUuid}`;
	const number = escapeHtml(input.orderNumber);
	const customer = escapeHtml(input.customerName || input.customerEmail);
	const email = escapeHtml(input.customerEmail);
	const phone = input.customerPhone ? `<span dir="ltr">${escapeHtml(input.customerPhone)}</span>` : "—";
	const details = input.details ? multiline(input.details) : "—";

	const html = renderBilingualOrderEmail({
		subject: `Return requested — order #${input.orderNumber}`,
		titleAr: "طلب إرجاع جديد",
		titleEn: "New Return Request",
		bodyAr: `طلب العميل <strong>${customer}</strong> إرجاع الطلب رقم <strong>#${number}</strong>.<br />
البريد الإلكتروني: <span dir="ltr">${email}</span><br />
الهاتف: ${phone}<br />
السبب: <strong>${escapeHtml(labels.ar)}</strong><br />
التفاصيل: ${details}<br />
وقت الطلب: ${escapeHtml(formatUaeDateTime(input.requestedAt, "ar"))} (بتوقيت الإمارات)`,
		bodyEn: `<strong>${customer}</strong> requested a return for order <strong>#${number}</strong>.<br />
Email: ${email}<br />
Phone: ${phone}<br />
Reason: <strong>${escapeHtml(labels.en)}</strong><br />
Details: ${details}<br />
Requested: ${escapeHtml(formatUaeDateTime(input.requestedAt, "en"))} (UAE time)`,
		ctaHref: adminUrl,
		ctaLabelAr: "مراجعة الطلب",
		ctaLabelEn: "Review the request →",
	});

	await transporter.sendMail({
		from: `"Tawasi Plus Returns" <info@tawasiplus.com>`,
		to: OPS_NOTIFICATION_EMAIL,
		subject: `Return requested — order #${input.orderNumber}`,
		html,
	});
}

type CustomerEmailBase = {
	to: string;
	orderNumber: string;
	orderUuid: string;
	locale: string;
	channel: string;
};

export async function sendReturnRejectedEmail(input: CustomerEmailBase & { note: string }): Promise<void> {
	const number = escapeHtml(input.orderNumber);
	const note = multiline(input.note);

	const html = renderBilingualOrderEmail({
		subject: `Return request for order #${input.orderNumber}`,
		titleAr: "بشأن طلب الإرجاع",
		titleEn: "About Your Return Request",
		bodyAr: `راجعنا طلب الإرجاع الخاص بالطلب رقم <strong>#${number}</strong>، ونعتذر عن عدم تمكّننا من قبوله.<br /><br />
<strong>السبب:</strong><br />${note}<br /><br />
إن كانت لديك أي استفسارات، يسعدنا تواصلك معنا.`,
		bodyEn: `We've reviewed the return request for order <strong>#${number}</strong> and unfortunately we're unable to accept it.<br /><br />
<strong>Reason:</strong><br />${note}<br /><br />
If you have any questions, please get in touch — we're happy to help.`,
		ctaHref: trackingUrl(input.locale, input.channel, input.orderUuid),
		ctaLabelAr: "عرض الطلب",
		ctaLabelEn: "View Your Order →",
	});

	await transporter.sendMail({
		from: FROM,
		to: input.to,
		subject: `Return request for order #${input.orderNumber} — Tawasi Plus`,
		html,
	});
}

export async function sendReturnPickupScheduledEmail(
	input: CustomerEmailBase & { pickupAt: Date; isReschedule: boolean },
): Promise<void> {
	const number = escapeHtml(input.orderNumber);
	const timeAr = escapeHtml(formatUaeDateTime(input.pickupAt, "ar"));
	const timeEn = escapeHtml(formatUaeDateTime(input.pickupAt, "en"));

	const html = renderBilingualOrderEmail({
		subject: `Return pickup scheduled — order #${input.orderNumber}`,
		titleAr: input.isReschedule ? "تم تغيير موعد استلام المرتجع" : "تمت الموافقة على طلب الإرجاع ✓",
		titleEn: input.isReschedule ? "Your Return Pickup Was Rescheduled" : "Your Return Was Approved ✓",
		bodyAr: `${
			input.isReschedule
				? `تم تحديث موعد استلام المرتجع الخاص بالطلب رقم <strong>#${number}</strong>.`
				: `وافقنا على طلب الإرجاع الخاص بالطلب رقم <strong>#${number}</strong>.`
		} سيحضر مندوبنا لاستلام المنتج في:<br />
<strong>${timeAr}</strong> (بتوقيت الإمارات)<br /><br />
يُرجى تجهيز المنتج في عبوته إن أمكن. سنُعلمك فور استلامه.`,
		bodyEn: `${
			input.isReschedule
				? `The pickup time for your return of order <strong>#${number}</strong> has been updated.`
				: `We've approved the return for order <strong>#${number}</strong>.`
		} Our courier will collect the item on:<br />
<strong>${timeEn}</strong> (UAE time)<br /><br />
Please have the item ready, in its packaging if possible. We'll let you know once we've received it.`,
		ctaHref: trackingUrl(input.locale, input.channel, input.orderUuid),
		ctaLabelAr: "تتبع الإرجاع",
		ctaLabelEn: "Track Your Return →",
	});

	await transporter.sendMail({
		from: FROM,
		to: input.to,
		subject: `Return pickup scheduled — order #${input.orderNumber} — Tawasi Plus`,
		html,
	});
}

export async function sendReturnItemReceivedEmail(input: CustomerEmailBase): Promise<void> {
	const number = escapeHtml(input.orderNumber);

	const html = renderBilingualOrderEmail({
		subject: `Return received — order #${input.orderNumber}`,
		titleAr: "استلمنا المرتجع ✓",
		titleEn: "We've Received Your Return ✓",
		bodyAr: `استلم مندوبنا المنتج المرتجع من الطلب رقم <strong>#${number}</strong>. سنُكمل إجراءات استرداد المبلغ، وستصلك رسالة منفصلة عند إصداره.`,
		bodyEn: `Our courier has collected the returned item from order <strong>#${number}</strong>. We'll now process your refund, and you'll receive a separate email once it has been issued.`,
		ctaHref: trackingUrl(input.locale, input.channel, input.orderUuid),
		ctaLabelAr: "تتبع الإرجاع",
		ctaLabelEn: "Track Your Return →",
	});

	await transporter.sendMail({
		from: FROM,
		to: input.to,
		subject: `Return received — order #${input.orderNumber} — Tawasi Plus`,
		html,
	});
}
