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
	type AddressInput,
	type AddressTypeEnum,
} from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";

async function getAuthHeaders(): Promise<Record<string, string>> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}

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
}): Promise<{ ok: boolean; error?: string }> {
	const headers = await getAuthHeaders();
	const result = await executeGraphQL(AccountUpdateDocument, {
		variables: { firstName: input.firstName, lastName: input.lastName },
		cache: "no-cache",
		headers,
	});
	const errors = result.accountUpdate?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, error: errors[0]?.message ?? "unknown" };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function createAddress(input: AddressInput): Promise<{ ok: boolean; error?: string }> {
	const headers = await getAuthHeaders();
	const result = await executeGraphQL(AccountAddressCreateDocument, {
		variables: { input },
		cache: "no-cache",
		headers,
	});
	const errors = result.accountAddressCreate?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, error: errors[0]?.message ?? "unknown" };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function updateAddress(
	id: string,
	input: AddressInput,
): Promise<{ ok: boolean; error?: string }> {
	const headers = await getAuthHeaders();
	const result = await executeGraphQL(AccountAddressUpdateDocument, {
		variables: { id, input },
		cache: "no-cache",
		headers,
	});
	const errors = result.accountAddressUpdate?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, error: errors[0]?.message ?? "unknown" };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean; error?: string }> {
	const headers = await getAuthHeaders();
	const result = await executeGraphQL(AccountAddressDeleteDocument, {
		variables: { id },
		cache: "no-cache",
		headers,
	});
	const errors = result.accountAddressDelete?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, error: errors[0]?.message ?? "unknown" };
	}
	revalidatePath("/", "layout");
	return { ok: true };
}

export async function setDefaultAddress(
	id: string,
	type: AddressTypeEnum,
): Promise<{ ok: boolean; error?: string }> {
	const headers = await getAuthHeaders();
	const result = await executeGraphQL(AccountSetDefaultAddressDocument, {
		variables: { id, type },
		cache: "no-cache",
		headers,
	});
	const errors = result.accountSetDefaultAddress?.errors ?? [];
	if (errors.length > 0) {
		return { ok: false, error: errors[0]?.message ?? "unknown" };
	}
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
