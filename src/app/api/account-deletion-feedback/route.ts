import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";

const FEEDBACK_TO = "info@tawasiplus.com";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST ?? "localhost",
	port: Number(process.env.SMTP_PORT ?? 1025),
	secure: process.env.SMTP_SECURE === "true",
	...(process.env.SMTP_USER
		? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } }
		: {}),
});

// Internal-only notification, always in English regardless of the customer's
// locale — this map is not user-facing copy, so it's not routed through i18n.
const REASON_LABELS: Record<string, string> = {
	noLongerUse: "I no longer use this account",
	haveAnotherAccount: "I have another account",
	wantNewAccount: "I want to create a new account",
	securityConcerns: "Account security / unauthorized activity concerns",
	privacyConcerns: "Privacy concerns",
	unresolvedIssues: "I have unresolved issues with Tawasi Plus",
};

export async function POST(request: NextRequest) {
	const body = (await request.json()) as { email?: string; reason?: string };
	const { email, reason } = body;

	if (!email?.trim() || !reason?.trim()) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
	}

	const reasonLabel = REASON_LABELS[reason];
	if (!reasonLabel) {
		return NextResponse.json({ error: "INVALID_REASON" }, { status: 400 });
	}

	const sentAt = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

	try {
		await transporter.sendMail({
			from: `"Tawasi Plus Account Closures" <info@tawasiplus.com>`,
			to: FEEDBACK_TO,
			subject: `Account Deletion Feedback: ${reasonLabel}`,
			html: `
<table style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:600px;width:100%;border-collapse:collapse">
  <tr><td style="padding:24px 24px 8px;background:#2D6A4F"><h2 style="margin:0;color:#fff;font-size:20px">Account Deletion Feedback</h2></td></tr>
  <tr><td style="padding:24px;background:#f9f9f9">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;width:120px;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px">Account</td><td style="padding:8px 0;font-weight:600">${escHtml(
				email,
			)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px">Reason</td><td style="padding:8px 0">${escHtml(
				reasonLabel,
			)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px;background:#eee;color:#999;font-size:12px">Sent at ${sentAt} (Dubai time)</td></tr>
</table>`,
			text: `Account: ${email}\nReason: ${reasonLabel}\n\nSent at: ${sentAt}`,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("[account-deletion-feedback] sendMail error:", err);
		return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
	}
}

function escHtml(str: string) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
