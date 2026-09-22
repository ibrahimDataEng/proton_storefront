import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { CourierIdentityDocument } from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

export type CourierIdentity = {
	token: string;
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
};

/**
 * COURIER_USER_IDS is a comma-separated list of Saleor global user IDs (not
 * emails — a courier's email can change, their account id can't). Unset/empty
 * means nobody is a courier: fail closed, not open.
 */
function getCourierUserIds(): Set<string> {
	const raw = process.env.COURIER_USER_IDS ?? "";
	return new Set(
		raw
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean),
	);
}

/**
 * Resolves the caller's own Saleor identity from their own access-token cookie
 * (never a client-supplied id, same discipline as resolveAuthenticatedUser() in
 * identity.ts) and requires: the id is in COURIER_USER_IDS, the account is
 * active, and — load-bearing — the account is NOT staff. Couriers are ordinary
 * customer accounts; a staff account must never pass here even if its id ends
 * up listed, since Saleor 3.23.35 grants a bare staff session several
 * unpermissioned capabilities (see the Phase 0 findings in CLAUDE.md's courier
 * section) that a courier login must never carry.
 *
 * No caching, re-checked on every call: an id can be removed from
 * COURIER_USER_IDS or an account deactivated at any time, and the next request
 * must see that immediately. (In practice Saleor's own JWT resolution already
 * rejects a deactivated user's token outright — see core/jwt.py's
 * get_user_from_payload, which filters is_active=True — so the isActive check
 * below is defense in depth, not the only thing standing between a deactivated
 * courier and the worklist.)
 */
export async function resolveCourier(): Promise<CourierIdentity | null> {
	const courierIds = getCourierUserIds();
	if (courierIds.size === 0) return null;

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
		if (!courierIds.has(me.id)) return null;
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
