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
	type AddressInput,
	type AddressTypeEnum,
} from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

async function getAuthHeaders(): Promise<Record<string, string>> {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
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
