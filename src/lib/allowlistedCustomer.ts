import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { CourierIdentityDocument } from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

export type AllowlistedCustomerIdentity = {
	token: string;
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
};

/**
 * Parses a comma-separated env var of Saleor global user IDs (not emails — a
 * customer's email can change, their account id can't). Unset/empty yields an
 * empty set, which every caller treats as "nobody is allowed": fail closed.
 */
function parseUserIdList(raw: string | undefined): Set<string> {
	return new Set(
		(raw ?? "")
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean),
	);
}

/**
 * Shared gate behind resolveCourier() (COURIER_USER_IDS) and resolveAdmin()
 * (ADMIN_USER_IDS). Each role reads its OWN env var — being listed in one never
 * grants the other.
 *
 * Resolves the caller's own Saleor identity from their own access-token cookie
 * (never a client-supplied id, same discipline as resolveAuthenticatedUser() in
 * identity.ts) and requires: the id is in the given allowlist, the account is
 * active, and — load-bearing — the account is NOT staff. These roles are
 * ordinary customer accounts; a staff account must never pass here even if its
 * id ends up listed, since Saleor 3.23.35 grants a bare staff session several
 * unpermissioned capabilities (see the Phase 0 findings in CLAUDE.md's courier
 * section) that these logins must never carry.
 *
 * No caching, re-checked on every call: an id can be removed from the allowlist
 * or an account deactivated at any time, and the next request must see that
 * immediately. (Saleor's own JWT resolution already rejects a deactivated
 * user's token outright — core/jwt.py's get_user_from_payload filters
 * is_active=True — so the isActive check is defense in depth.)
 */
export async function resolveAllowlistedCustomer(
	rawAllowlist: string | undefined,
): Promise<AllowlistedCustomerIdentity | null> {
	const allowedIds = parseUserIdList(rawAllowlist);
	if (allowedIds.size === 0) return null;

	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	if (!token) return null;

	try {
		const data = await executeGraphQL(CourierIdentityDocument, {
			withAuth: false,
			cache: "no-cache",
			headers: { Authorization: `Bearer ${token}` },
		});
		const me = data.me;
		if (!me?.id) return null;
		if (!allowedIds.has(me.id)) return null;
		if (!me.isActive) return null;
		if (me.isStaff) return null;

		return {
			token,
			userId: me.id,
			email: me.email,
			firstName: me.firstName,
			lastName: me.lastName,
		};
	} catch {
		return null;
	}
}
