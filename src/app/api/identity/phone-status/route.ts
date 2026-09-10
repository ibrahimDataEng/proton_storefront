import { NextResponse } from "next/server";
import { callIdentityService, resolveAuthenticatedUser } from "@/lib/identity";

export async function GET(): Promise<NextResponse<{ hasPhone: boolean }>> {
	const auth = await resolveAuthenticatedUser();
	if (!auth) {
		// No session at all. The login-gate only ever runs for a logged-in user in the
		// first place, so this is just a defensive default, not the fail-open path below.
		return NextResponse.json({ hasPhone: true });
	}

	const result = await callIdentityService(`/phones/status/${encodeURIComponent(auth.userId)}`, {
		method: "GET",
	});

	// FAIL-OPEN BY DESIGN. proton_identity being down, slow, or erroring must never
	// lock a user out of their own account — only a genuine, successfully-received
	// `hasPhone: false` may trigger the login-gate. Do NOT "fix" this to fail-closed
	// without first reading CLAUDE.md's rationale for this route: a phone-lookup
	// outage is real infrastructure that will happen, and the cost of it accidentally
	// locking out every existing customer is far worse than the cost of the phone
	// requirement being unenforced for the duration of that outage.
	if (!result.reachable) {
		console.error(`[phone-status] proton_identity unreachable (${result.reason}) for user ${auth.userId}`);
		return NextResponse.json({ hasPhone: true });
	}

	if (!result.response.ok) {
		console.error(
			`[phone-status] proton_identity returned ${result.response.status} for user ${auth.userId}`,
		);
		return NextResponse.json({ hasPhone: true });
	}

	try {
		const data = (await result.response.json()) as { hasPhone?: boolean };
		// Anything other than an explicit `false` is treated as "has a phone" — same
		// fail-open bias applied to a malformed/unexpected response body.
		return NextResponse.json({ hasPhone: data.hasPhone !== false });
	} catch {
		return NextResponse.json({ hasPhone: true });
	}
}
