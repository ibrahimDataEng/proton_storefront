import { NextResponse, type NextRequest } from "next/server";
import { callIdentityService, resolveAuthenticatedUser } from "@/lib/identity";

type SetPhoneOutcome = "success" | "invalid" | "conflict" | "service_error";

export async function POST(request: NextRequest): Promise<NextResponse<{ outcome: SetPhoneOutcome }>> {
	const auth = await resolveAuthenticatedUser();
	if (!auth) {
		return NextResponse.json({ outcome: "service_error" }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as { phone?: unknown } | null;
	const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
	if (!phone) {
		return NextResponse.json({ outcome: "invalid" }, { status: 400 });
	}

	const result = await callIdentityService("/phones", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId: auth.userId, phone }),
	});

	if (!result.reachable) {
		console.error(`[set-phone] proton_identity unreachable (${result.reason}) for user ${auth.userId}`);
		return NextResponse.json({ outcome: "service_error" }, { status: 503 });
	}

	if (result.response.status === 200) {
		return NextResponse.json({ outcome: "success" });
	}
	if (result.response.status === 400) {
		return NextResponse.json({ outcome: "invalid" }, { status: 400 });
	}
	if (result.response.status === 409) {
		return NextResponse.json({ outcome: "conflict" }, { status: 409 });
	}

	console.error(`[set-phone] proton_identity returned ${result.response.status} for user ${auth.userId}`);
	return NextResponse.json({ outcome: "service_error" }, { status: 502 });
}
