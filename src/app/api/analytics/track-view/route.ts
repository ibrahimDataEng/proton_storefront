import { NextResponse, type NextRequest } from "next/server";

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL;

/**
 * Same-origin proxy to proton_analytics' POST /track-view.
 *
 * This route exists so the browser never talks to proton_analytics directly:
 * that service has no auth and is internal-network only. The client only ever
 * calls this same-origin Next.js route.
 *
 * View tracking is strictly best-effort — this always answers 202, even when the
 * forward fails, so an analytics outage can never surface as an error in the
 * browser or affect page rendering.
 */
export async function POST(request: NextRequest) {
	let productId: unknown;
	try {
		const body = (await request.json()) as { productId?: unknown };
		productId = body?.productId;
	} catch {
		return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
	}

	if (typeof productId !== "string" || productId.trim() === "") {
		return NextResponse.json({ error: "INVALID_PRODUCT_ID" }, { status: 400 });
	}

	try {
		if (!ANALYTICS_SERVICE_URL) {
			throw new Error("ANALYTICS_SERVICE_URL is not configured");
		}
		await fetch(`${ANALYTICS_SERVICE_URL}/track-view`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productId: productId.trim() }),
			signal: AbortSignal.timeout(2000),
			cache: "no-store",
		});
	} catch (error) {
		// Swallowed on purpose: a tracking failure must never reach the shopper.
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[analytics/track-view] forward failed for "${productId}": ${message}`);
	}

	return NextResponse.json({ status: "accepted" }, { status: 202 });
}
