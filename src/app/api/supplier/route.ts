import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";

const SUPPLIER_TO = process.env.CONTACT_TO_EMAIL ?? "tawasiplus2026@gmail.com";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/zip",
	"application/x-zip-compressed",
	"image/jpeg",
	"image/png",
]);

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST ?? "localhost",
	port: Number(process.env.SMTP_PORT ?? 1025),
	secure: process.env.SMTP_SECURE === "true",
	...(process.env.SMTP_USER
		? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } }
		: {}),
});

async function verifyTurnstile(token: string, remoteip: string | null): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY;
	if (!secret) return false;

	const body = new URLSearchParams({ secret, response: token });
	if (remoteip) body.set("remoteip", remoteip);

	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const data = (await res.json()) as { success?: boolean };
		return data.success === true;
	} catch {
		return false;
	}
}

export async function POST(request: NextRequest) {
	const formData = await request.formData();

	const get = (key: string) => (formData.get(key) as string | null)?.trim() ?? "";

	// Honeypot — bots that fill hidden fields get a fake success, no email is sent.
	if (get("website_url_2")) {
		return NextResponse.json({ success: true });
	}

	const companyName = get("companyName");
	const country = get("country");
	const contactName = get("contactName");
	const website = get("website");
	const email = get("email");
	const phoneCode = get("phoneCode");
	const phoneNumber = get("phoneNumber");
	const businessType = get("businessType");
	const categories = formData
		.getAll("categories")
		.map((v) => String(v).trim())
		.filter(Boolean);
	const products = get("products");
	const natureOfBusiness = get("natureOfBusiness");
	const certifications = formData
		.getAll("certifications")
		.map((v) => String(v).trim())
		.filter(Boolean);
	const turnstileToken = get("turnstileToken");
	const termsAgreed = get("termsAgreed") === "true";

	if (
		!companyName ||
		!country ||
		!contactName ||
		!email ||
		!phoneCode ||
		!phoneNumber ||
		!businessType ||
		categories.length === 0 ||
		!products ||
		!natureOfBusiness ||
		!termsAgreed
	) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
	}

	if (website && !/^https?:\/\/.+/.test(website)) {
		return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
	}

	if (natureOfBusiness.length > 2000) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
	}

	if (!turnstileToken) {
		return NextResponse.json({ error: "TURNSTILE_FAILED" }, { status: 400 });
	}

	const remoteip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
	const turnstileOk = await verifyTurnstile(turnstileToken, remoteip);
	if (!turnstileOk) {
		return NextResponse.json({ error: "TURNSTILE_FAILED" }, { status: 400 });
	}

	const file = formData.get("file");
	let attachment: { filename: string; content: Buffer; contentType: string } | null = null;

	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
		}
		if (!ALLOWED_MIME_TYPES.has(file.type)) {
			return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
		}
		const buffer = Buffer.from(await file.arrayBuffer());
		attachment = { filename: file.name, content: buffer, contentType: file.type };
	}

	const sentAt = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

	const rows: [string, string][] = [
		["Company Name", companyName],
		["Country of Operation", country],
		["Sales Contact", contactName],
		["Website", website || "—"],
		["Email", email],
		["Phone", `${phoneCode} ${phoneNumber}`],
		["Business Type", businessType],
		["Proposed Categories", categories.join(", ")],
		["Proposed Products", products],
		["Nature of Business", natureOfBusiness],
		["Certifications", certifications.length > 0 ? certifications.join(", ") : "—"],
	];

	try {
		await transporter.sendMail({
			from: `"Tawasi Plus Suppliers" <info@tawasiplus.com>`,
			to: SUPPLIER_TO,
			replyTo: email,
			subject: `New Supplier Application: ${companyName}`,
			html: `
<table style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:600px;width:100%;border-collapse:collapse">
  <tr><td style="padding:24px 24px 8px;background:#2D6A4F"><h2 style="margin:0;color:#fff;font-size:20px">New Supplier Application</h2></td></tr>
  <tr><td style="padding:24px;background:#f9f9f9">
    <table style="width:100%;border-collapse:collapse">
      ${rows
				.map(
					([label, value]) =>
						`<tr><td style="padding:8px 0;width:160px;color:#666;font-size:13px;text-transform:uppercase;letter-spacing:.5px;vertical-align:top">${escHtml(
							label,
						)}</td><td style="padding:8px 0;white-space:pre-wrap">${escHtml(value)}</td></tr>`,
				)
				.join("")}
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px;background:#eee;color:#999;font-size:12px">Sent at ${sentAt} (Dubai time)</td></tr>
</table>`,
			text: rows.map(([label, value]) => `${label}: ${value}`).join("\n") + `\n\nSent at: ${sentAt}`,
			attachments: attachment ? [attachment] : undefined,
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("[supplier] sendMail error:", err);
		return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
	}
}

function escHtml(str: string) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
