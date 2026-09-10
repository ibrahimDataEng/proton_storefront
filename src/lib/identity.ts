import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserDocument } from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

const SERVICE_URL = process.env.PHONE_IDENTITY_SERVICE_URL;
const SERVICE_TOKEN = process.env.PHONE_IDENTITY_SERVICE_TOKEN;

const REQUEST_TIMEOUT_MS = 3000;

export type AuthenticatedIdentity = { token: string; userId: string };

/**
 * Resolves the caller's own Saleor user id from their own access-token cookie via a
 * `me { id }` fetch — never trusts a client-supplied userId. Mirrors
 * account/actions.ts's pattern of reading the auth cookie directly rather than
 * anything in the request body.
 */
export async function resolveAuthenticatedUser(): Promise<AuthenticatedIdentity | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	if (!token) return null;

	try {
		const data = await executeGraphQL(CurrentUserDocument, {
			withAuth: false,
			cache: "no-cache",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!data.me?.id) return null;
		return { token, userId: data.me.id };
	} catch {
		return null;
	}
}

export type IdentityServiceResult =
	| { reachable: true; response: Response }
	| { reachable: false; reason: "not_configured" | "network" };

/**
 * Proxies a request to proton_identity with the service-level Bearer token
 * (PHONE_IDENTITY_SERVICE_TOKEN — server-side only, never forwarded to or read from
 * the browser) and a hard 3s timeout, so a slow/hung proton_identity can never stall
 * the caller indefinitely. Every network/timeout/config failure is logged here and
 * surfaced as `reachable: false` — callers decide fail-open vs fail-closed themselves,
 * since that decision differs between the two routes built on top of this helper.
 */
export async function callIdentityService(path: string, init: RequestInit): Promise<IdentityServiceResult> {
	if (!SERVICE_URL || !SERVICE_TOKEN) {
		console.error("[identity] PHONE_IDENTITY_SERVICE_URL/PHONE_IDENTITY_SERVICE_TOKEN not configured");
		return { reachable: false, reason: "not_configured" };
	}

	try {
		const response = await fetch(`${SERVICE_URL}${path}`, {
			...init,
			headers: {
				...init.headers,
				Authorization: `Bearer ${SERVICE_TOKEN}`,
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			cache: "no-store",
		});
		return { reachable: true, response };
	} catch (error) {
		console.error(`[identity] request to proton_identity${path} failed:`, error);
		return { reachable: false, reason: "network" };
	}
}
