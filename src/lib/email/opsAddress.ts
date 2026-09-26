/**
 * Internal ops inbox for owner-facing notifications (new orders, return
 * requests). Single source of truth — the order-created webhook reads it too.
 */
export const OPS_NOTIFICATION_EMAIL = process.env.CONTACT_TO_EMAIL ?? "tawasiplus2026@gmail.com";

/**
 * Absolute storefront origin for links inside emails: the production domain
 * (the same one deliveredEmail.ts's tracking links hardcode), unless
 * NEXT_PUBLIC_STOREFRONT_URL says otherwise — an https value is always honored,
 * a plain-http one (e.g. http://localhost:3000) only outside production, so a
 * stray example value in a production env file can never put localhost links
 * into a real customer's email.
 */
export function storefrontOrigin(): string {
	const configured = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim().replace(/\/+$/, "");
	if (configured?.startsWith("https://")) return configured;
	if (configured?.startsWith("http://") && process.env.NODE_ENV !== "production") return configured;
	return "https://tawasiplus.com";
}
