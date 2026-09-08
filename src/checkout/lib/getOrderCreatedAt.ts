/**
 * Fetches just `Order.created` via a plain, standalone request — deliberately
 * NOT going through src/checkout/graphql/ (off-limits) or the urql client
 * config in Root.tsx. `OrderFragment` doesn't carry a creation timestamp and
 * the fragment file can't be touched, so this exists purely to get the one
 * extra field OrderConfirmation needs for a correct (order-time-based, not
 * view-time-based) delivery estimate.
 *
 * `Order.created` is a plain public field (no PermissionsField, no
 * permission note in the schema) — confirmed against the Saleor 3.23.1
 * source — so this works for an anonymous/guest order-confirmation view,
 * unlike `transactions`/`events` (both require MANAGE_ORDERS/HANDLE_PAYMENTS).
 *
 * Same pattern already used by src/app/api/auth/set-password/route.ts: a
 * raw inline query string + direct fetch(), not the generated Document.
 *
 * Returns null on any failure — this is a best-effort enhancement; the
 * caller falls back to static copy rather than blocking on it.
 */
export async function getOrderCreatedAt(orderId: string): Promise<Date | null> {
	const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (!apiUrl) return null;

	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `query OrderCreatedAt($id: ID!) { order(id: $id) { created } }`,
				variables: { id: orderId },
			}),
		});
		if (!response.ok) return null;

		const body = (await response.json()) as { data?: { order?: { created?: string } } };
		const created = body.data?.order?.created;
		if (!created) return null;

		const date = new Date(created);
		return Number.isNaN(date.getTime()) ? null : date;
	} catch {
		return null;
	}
}
