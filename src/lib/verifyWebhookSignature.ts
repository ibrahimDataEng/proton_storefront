import crypto from "node:crypto";

/**
 * Verifies Saleor's HMAC-SHA256 webhook signature.
 *
 * Saleor computes `hmac.new(secret_key, raw_body, sha256).hexdigest()` and
 * sends it in the `Saleor-Signature` header (confirmed against
 * saleor/webhook/transport/__init__.py in the 3.23.1 reference clone — same
 * verification this project's proton-payments service already uses). Must
 * run against the exact raw request bytes — a re-serialized JSON body would
 * not reproduce the same signature.
 */
export function verifyWebhookSignature(
	rawBody: Buffer,
	signatureHeader: string | null,
	secret: string | undefined,
): boolean {
	if (!secret || !signatureHeader) {
		return false;
	}

	const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

	const expectedBuf = Buffer.from(expected, "utf8");
	const receivedBuf = Buffer.from(signatureHeader, "utf8");

	// timingSafeEqual throws on length mismatch rather than returning false.
	if (expectedBuf.length !== receivedBuf.length) {
		return false;
	}

	return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
