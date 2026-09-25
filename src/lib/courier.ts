import { resolveAllowlistedCustomer, type AllowlistedCustomerIdentity } from "@/lib/allowlistedCustomer";

export type CourierIdentity = AllowlistedCustomerIdentity;

/**
 * COURIER_USER_IDS is a comma-separated list of Saleor global user IDs. Unset or
 * empty means nobody is a courier (fails closed). Listed + active + non-staff is
 * required — see resolveAllowlistedCustomer() for the full rationale, including
 * why a staff account is refused even when listed. Being a courier never makes
 * someone an admin (ADMIN_USER_IDS, resolveAdmin()) and vice versa.
 */
export async function resolveCourier(): Promise<CourierIdentity | null> {
	return resolveAllowlistedCustomer(process.env.COURIER_USER_IDS);
}
