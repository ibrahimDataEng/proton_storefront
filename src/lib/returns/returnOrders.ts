import { readMetadataRaw, RETURN_METADATA_KEYS, type OrderMetadataEntry } from "./returnMetadata";
import { executeGraphQL } from "@/lib/graphql";
import {
	CourierUpdateOrderMetadataDocument,
	ReturnOrderByIdDocument,
	type ReturnOrderFragment,
} from "@/gql/graphql";

/**
 * Server-side Saleor I/O for the return flow. Customers and admins are plain
 * customer accounts with zero Saleor permissions, so every order read/write
 * here uses SALEOR_RETURNS_APP_TOKEN — a dedicated Saleor App with only
 * MANAGE_ORDERS (the permission updateMetadata needs on an Order, see
 * saleor/graphql/meta/permissions.py). Never reachable from the browser.
 */
export function getReturnsAppToken(): string | null {
	return process.env.SALEOR_RETURNS_APP_TOKEN || null;
}

export async function fetchOrderForReturn(
	orderId: string,
	appToken: string,
): Promise<ReturnOrderFragment | null> {
	const data = await executeGraphQL(ReturnOrderByIdDocument, {
		variables: { id: orderId },
		withAuth: false,
		cache: "no-cache",
		headers: { Authorization: `Bearer ${appToken}` },
	});
	return data.order ?? null;
}

/** Writes (merges) public metadata keys on an order. Returns false on any error. */
export async function writeOrderMetadata(
	orderId: string,
	entries: { key: string; value: string }[],
	appToken: string,
): Promise<boolean> {
	try {
		const result = await executeGraphQL(CourierUpdateOrderMetadataDocument, {
			variables: { id: orderId, input: entries },
			withAuth: false,
			cache: "no-cache",
			headers: { Authorization: `Bearer ${appToken}` },
		});
		if (result.updateMetadata?.metadataErrors.length) {
			console.error("[returns] updateMetadata returned errors:", result.updateMetadata.metadataErrors);
			return false;
		}
		return true;
	} catch (error) {
		console.error("[returns] updateMetadata failed:", error);
		return false;
	}
}

/**
 * Tracking-page/email locale for a return: the locale the customer requested
 * it in, falling back to the caller's.
 */
export function returnLocale(metadata: readonly OrderMetadataEntry[], fallback: string): string {
	const stored = readMetadataRaw(metadata, RETURN_METADATA_KEYS.locale);
	return stored === "ar" || stored === "en" ? stored : fallback;
}

/** Relay global id for an Order UUID — the inverse of orderGlobalIdToUuid(). */
export function orderUuidToGlobalId(uuid: string): string {
	return Buffer.from(`Order:${uuid}`).toString("base64");
}

export const ORDER_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
