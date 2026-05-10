import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";

const CONTACT_TO = process.env.CONTACT_TO_EMAIL ?? "greenlinegroup002@gmail.com";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST ?? "localhost",
	port: Number(process.env.SMTP_PORT ?? 1025),
	secure: process.env.SMTP_SECURE === "true",
	...(process.env.SMTP_USER
		? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } }
		: {}),
});

export async function POST(request: NextRequest) {
	const body = (await request.json()) as {
		name?: string;
		email?: string;
		subject?: string;
		message?: string;
	};

	const { name, email, subject, message } = body;

	if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
	}

	const sentAt = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

	try {
		await transporter.sendMail({
			from: `"Green Line Group Contact" <noreply@greenlinegroup.com>`,
			to: CONTACT_TO,
			replyTo: email,
			subject: `New Contact Form Message: ${subject}`,
			html: `
<table style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:600px;width:100%;border-collapse:collapse">
  <tr><td style="padding:24px 24px 8px;background:#2D6A4F"><h2 style="margin:0;color:#fff;font-size:20px">New Contact Form Submission</h2></td></tr>
  <tr><td style="padding:24px;background:#f9f9f9">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;width:120px;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px">Name</td><td style="padding:8px 0;font-weight:600">${escHtml(
				name,
			)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px">Email</td><td style="padding:8px 0"><a href="mailto:${escHtml(
				email,
			)}" style="color:#2D6A4F">${escHtml(email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px">Subject</td><td style="padding:8px 0">${escHtml(
				subject,
			)}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-wrap">${escHtml(
				message,
			)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px;background:#eee;color:#999;font-size:12px">Sent at ${sentAt} (Dubai time)</td></tr>
</table>`,
			text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSent at: ${sentAt}`,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("[contact] sendMail error:", err);
		return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
	}
}

function escHtml(str: string) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
