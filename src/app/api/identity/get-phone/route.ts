import { NextResponse } from "next/server";
import { callIdentityService, resolveAuthenticatedUser } from "@/lib/identity";

type GetPhoneResult = { outcome: "success"; phone: string | null } | { outcome: "service_error" };

/**
 * Backs Account Settings' phone view/edit field — a deliberate, narrow exception to
 * phone-status's PII-minimization design (see that route + proton_identity's README).
 * Unlike phone-status, this must NOT fail open: there is no safe default phone number to
 * hand back on an outage, so any failure — no session, proton_identity unreachable, a
 * non-200, a malformed body — surfaces as `service_error` for the UI to show as
 * "couldn't load," never as a fabricated `phone: null` that could be misread as
 * "confirmed no phone on file."
 */
export async function GET(): Promise<NextResponse<GetPhoneResult>> {
	const auth = await resolveAuthenticatedUser();
	if (!auth) {
		return NextResponse.json({ outcome: "service_error" }, { status: 401 });
	}

	const result = await callIdentityService(`/phones/${encodeURIComponent(auth.userId)}`, {
		method: "GET",
	});

	if (!result.reachable) {
		console.error(`[get-phone] proton_identity unreachable (${result.reason}) for user ${auth.userId}`);
		return NextResponse.json({ outcome: "service_error" }, { status: 503 });
	}

	if (!result.response.ok) {
		console.error(`[get-phone] proton_identity returned ${result.response.status} for user ${auth.userId}`);
		return NextResponse.json({ outcome: "service_error" }, { status: 503 });
	}

	try {
		const data = (await result.response.json()) as { phone?: string | null };
		return NextResponse.json({ outcome: "success", phone: data.phone ?? null });
	} catch {
		console.error(`[get-phone] malformed response body for user ${auth.userId}`);
		return NextResponse.json({ outcome: "service_error" }, { status: 503 });
	}
}
