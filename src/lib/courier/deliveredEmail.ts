import { type CourierPaymentMethod } from "./orderEligibility";
import { transporter } from "@/lib/mailer";
import { renderBilingualOrderEmail, escapeHtml } from "@/lib/email/bilingualOrderEmail";
import { formatMoney } from "@/lib/utils";

export type SendDeliveredEmailInput = {
	to: string;
	orderNumber: string;
	orderUuid: string;
	locale: string;
	channel: string;
	paymentMethod: CourierPaymentMethod;
	codAmount: number;
	currency: string;
};

/**
 * Fire-once, best-effort. Callers (the mark-delivered server action) must
 * decide for themselves whether to skip this and must record
 * deliveredEmailSentAt after a successful send — this function has no
 * knowledge of "already sent" and will happily resend if called twice.
 */
export async function sendOrderDeliveredEmail(input: SendDeliveredEmailInput): Promise<void> {
	const trackingUrl = `https://tawasiplus.com/${input.locale}/${input.channel}/track-order/${input.orderUuid}`;

	const paymentLineAr =
		input.paymentMethod === "cod"
			? `تم الدفع نقدًا عند الاستلام: <strong>${escapeHtml(
					formatMoney(input.codAmount, input.currency),
				)}</strong>`
			: input.paymentMethod === "card"
				? "تم الدفع مسبقًا ببطاقة الدفع."
				: "يرجى مراجعة طريقة الدفع مع الفريق.";

	const paymentLineEn =
		input.paymentMethod === "cod"
			? `Paid in cash on delivery: <strong>${escapeHtml(
					formatMoney(input.codAmount, input.currency),
				)}</strong>`
			: input.paymentMethod === "card"
				? "Already paid by card."
				: "Please check the payment method with our team.";

	const html = renderBilingualOrderEmail({
		subject: `Order #${input.orderNumber} delivered`,
		titleAr: "تم تسليم طلبك ✓",
		titleEn: "Your Order Was Delivered ✓",
		bodyAr: `تم تسليم طلبك رقم <strong>#${escapeHtml(input.orderNumber)}</strong> بنجاح. ${paymentLineAr}`,
		bodyEn: `Your order <strong>#${escapeHtml(
			input.orderNumber,
		)}</strong> has been delivered. ${paymentLineEn}`,
		ctaHref: trackingUrl,
		ctaLabelAr: "تتبع طلبك",
		ctaLabelEn: "Track Your Order →",
	});

	await transporter.sendMail({
		from: `"Tawasi Plus" <info@tawasiplus.com>`,
		to: input.to,
		subject: `Order #${input.orderNumber} delivered — Tawasi Plus`,
		html,
	});
}
