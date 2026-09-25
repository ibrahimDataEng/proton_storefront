"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import {
	AccountUpdateDocument,
	AccountAddressCreateDocument,
	AccountAddressUpdateDocument,
	AccountAddressDeleteDocument,
	AccountSetDefaultAddressDocument,
	CurrentUserDocument,
	UpdateUserMetadataDocument,
	AccountRequestDeletionDocument,
	AccountDeleteDocument,
	type AddressInput,
	type AddressTypeEnum,
} from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { isSessionError, mapAccountError, type AccountErrorCode } from "@/lib/account/errorCodes";

async function getAuthHeaders(): Promise<Record<string, string>> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}

// Every mutating action returns an error CODE from ACCOUNT_ERROR_CODES, never a
// Saleor message string — callers render it via resolveErrorMessage(t, code).
export type AccountActionResult = { ok: true } | { ok: false; error: AccountErrorCode };

type SaleorMutationError = { field?: string | null; code?: string | null; message?: string | null };

function toFailure(action: string, errors: readonly SaleorMutationError[]): AccountActionResult {
	const first = errors[0];
	const error = mapAccountError(first?.code, first?.field);
	if (error === "unknown") {
		console.error(
			`[account] ${action}: unmapped error ${first?.code} on ${first?.field ?? "-"}: ${first?.message}`,
		);
	}
	return { ok: false, error };
}

/**
 * Runs a Saleor call; an expired/invalid session (which executeGraphQL throws
 * as a GraphQLError) comes back as SESSION_EXPIRED instead of a throw. Any other
 * failure (network, Saleor down) still throws — every caller wraps these actions
 * in try/catch and shows a translated generic message.
 */
async function withSession<T>(run: () => Promise<T>): Promise<T | "SESSION_EXPIRED"> {
	try {
		return await run();
	} catch (error) {
		if (isSessionError(error)) return "SESSION_EXPIRED";
		throw error;
	}
}

const SESSION_EXPIRED: AccountActionResult = { ok: false, error: "SESSION_EXPIRED" };

const RECENTLY_VIEWED_METADATA_KEY = "recentlyViewed";
const MAX_RECENTLY_VIEWED = 20;

export type RecentlyViewedItem = { slug: string; viewedAt: string };

function isRecentlyViewedItem(value: unknown): value is RecentlyViewedItem {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as RecentlyViewedItem).slug === "string" &&
		typeof (value as RecentlyViewedItem).viewedAt === "string"
	);
}

function parseRecentlyViewed(raw: string | null | undefined): RecentlyViewedItem[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isRecentlyViewedItem) : [];
	} catch {
		return [];
	}
}

export async function updateAccount(input: {
	firstName: string;
	lastName: string;
}): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountUpdateDocument, {
			variables: { firstName: input.firstName, lastName: input.lastName },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountUpdate?.errors ?? [];
	if (errors.length > 0) return toFailure("updateAccount", errors);
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function createAddress(input: AddressInput): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountAddressCreateDocument, {
			variables: { input },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountAddressCreate?.errors ?? [];
	if (errors.length > 0) return toFailure("createAddress", errors);
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function updateAddress(id: string, input: AddressInput): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountAddressUpdateDocument, {
			variables: { id, input },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountAddressUpdate?.errors ?? [];
	if (errors.length > 0) return toFailure("updateAddress", errors);
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function deleteAddress(id: string): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountAddressDeleteDocument, {
			variables: { id },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountAddressDelete?.errors ?? [];
	if (errors.length > 0) return toFailure("deleteAddress", errors);
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function setDefaultAddress(id: string, type: AddressTypeEnum): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountSetDefaultAddressDocument, {
			variables: { id, type },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountSetDefaultAddress?.errors ?? [];
	if (errors.length > 0) return toFailure("setDefaultAddress", errors);
	revalidatePath("/", "layout");
	return { ok: true };
}

// Fire-and-forget: never let a tracking failure affect the PDP. Saleor's public
// metadata has no atomic append (full key overwrite only) and no optimistic
// locking, so a very tight race between two views can silently lose one of them
// — acceptable for a low-stakes, non-financial feature (see session 35 diagnostic).
export async function recordProductView(slug: string): Promise<void> {
	try {
		const cookieStore = await cookies();
		const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
		if (!accessToken) return; // guests aren't tracked

		const userId = decodeJwtPayload(accessToken)["user_id"];
		if (typeof userId !== "string" || !userId) return;

		const headers = { Authorization: `Bearer ${accessToken}` };
		const { me } = await executeGraphQL(CurrentUserDocument, { cache: "no-cache", headers });
		const raw = me?.metadata.find((item) => item.key === RECENTLY_VIEWED_METADATA_KEY)?.value;

		const items = parseRecentlyViewed(raw).filter((item) => item.slug !== slug);
		items.unshift({ slug, viewedAt: new Date().toISOString() });
		items.length = Math.min(items.length, MAX_RECENTLY_VIEWED);

		await executeGraphQL(UpdateUserMetadataDocument, {
			variables: { id: userId, input: [{ key: RECENTLY_VIEWED_METADATA_KEY, value: JSON.stringify(items) }] },
			cache: "no-cache",
			headers,
		});
	} catch (error) {
		if (process.env.NODE_ENV !== "production") {
			console.warn("recordProductView failed:", error);
		}
	}
}

export async function getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
	try {
		const headers = await getAuthHeaders();
		if (!headers.Authorization) return [];
		const { me } = await executeGraphQL(CurrentUserDocument, { cache: "no-cache", headers });
		const raw = me?.metadata.find((item) => item.key === RECENTLY_VIEWED_METADATA_KEY)?.value;
		return parseRecentlyViewed(raw);
	} catch {
		return [];
	}
}

export async function requestAccountDeletion(input: {
	redirectUrl: string;
	channel: string;
}): Promise<AccountActionResult> {
	const headers = await getAuthHeaders();
	const result = await withSession(() =>
		executeGraphQL(AccountRequestDeletionDocument, {
			variables: { redirectUrl: input.redirectUrl, channel: input.channel },
			cache: "no-cache",
			headers,
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountRequestDeletion?.errors ?? [];
	if (errors.length > 0) return toFailure("requestAccountDeletion", errors);
	return { ok: true };
}

export async function confirmAccountDeletion(token: string): Promise<AccountActionResult> {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	// No session at all, or one Saleor rejects (expired/invalid): both mean the
	// customer has to sign in again before the deletion link can be used.
	if (!accessToken) return SESSION_EXPIRED;

	const result = await withSession(() =>
		executeGraphQL(AccountDeleteDocument, {
			variables: { token },
			cache: "no-cache",
			headers: { Authorization: `Bearer ${accessToken}` },
		}),
	);
	if (result === "SESSION_EXPIRED") return SESSION_EXPIRED;
	const errors = result.accountDelete?.errors ?? [];
	if (errors.length > 0) return toFailure("confirmAccountDeletion", errors);

	// Deleted user's tokens are no longer valid for anything — clear them now
	// rather than waiting for the client-side logout() round trip.
	cookieStore.set(COOKIE_ACCESS_TOKEN, "", { maxAge: 0, path: "/" });
	cookieStore.set(COOKIE_REFRESH_TOKEN, "", { maxAge: 0, path: "/" });

	return { ok: true };
}
