import nodemailer from "nodemailer";

/**
 * Shared nodemailer transporter — single source of truth for SMTP config,
 * used by every internal/customer-facing email route (contact form, order
 * webhook notifications, etc.). Do not duplicate this createTransport call
 * elsewhere; import `transporter` instead.
 */
export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST ?? "localhost",
	port: Number(process.env.SMTP_PORT ?? 1025),
	secure: process.env.SMTP_SECURE === "true",
	...(process.env.SMTP_USER
		? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } }
		: {}),
});
