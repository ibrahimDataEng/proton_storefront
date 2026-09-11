import { NextResponse, type NextRequest } from "next/server";
import { callIdentityService } from "@/lib/identity";

type SendOtpOutcome = "sent" | "invalid_phone" | "rate_limited" | "service_error";

/**
 * Server-side proxy to proton_identity's POST /otp/send — the browser never talks to
 * proton_identity directly (it has no public exposure, same pattern as
 * ANALYTICS_SERVICE_URL/proton_analytics). Reuses identity.ts's callIdentityService,
 * which already applies the SERVICE_TOKEN header and a 3s AbortSignal.timeout.
 */
export async function POST(
	request: NextRequest,
): Promise<NextResponse<{ outcome: SendOtpOutcome; expiresInSeconds?: number }>> {
	const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
	const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
	if (!phone) {
		return NextResponse.json({ outcome: "invalid_phone" }, { status: 400 });
	}

	const result = await callIdentityService("/otp/send", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ phone }),
	});

	if (!result.reachable) {
		console.error(`[otp/send] proton_identity unreachable (${result.reason})`);
		return NextResponse.json({ outcome: "service_error" }, { status: 503 });
	}

	if (result.response.status === 200) {
		const data = (await result.response.json().catch(() => null)) as { expiresInSeconds?: number } | null;
		return NextResponse.json({ outcome: "sent", expiresInSeconds: data?.expiresInSeconds ?? 300 });
	}
	if (result.response.status === 400) {
		return NextResponse.json({ outcome: "invalid_phone" }, { status: 400 });
	}
	if (result.response.status === 429) {
		// Covers both of proton_identity's distinct 429 reasons (resend-too-soon and
		// the hourly cap) uniformly — the storefront's own resend-cooldown UI already
		// prevents a legitimate user from hitting either one under normal use, so
		// there's no user-facing benefit to distinguishing them here.
		return NextResponse.json({ outcome: "rate_limited" }, { status: 429 });
	}

	console.error(`[otp/send] proton_identity returned ${result.response.status}`);
	return NextResponse.json({ outcome: "service_error" }, { status: 502 });
}
