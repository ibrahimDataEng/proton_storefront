import { resolveAllowlistedCustomer, type AllowlistedCustomerIdentity } from "@/lib/allowlistedCustomer";

export type AdminIdentity = AllowlistedCustomerIdentity;

/**
 * ADMIN_USER_IDS is a comma-separated list of Saleor global user IDs allowed to
 * review return requests on /admin/returns. Deliberately a SEPARATE list from
 * COURIER_USER_IDS: a courier never reaches admin actions, and an admin is not
 * automatically a courier. Same rules as the courier gate — ids only, listed +
 * active + NOT staff, fails closed when unset, re-checked on every request and
 * server action (see resolveAllowlistedCustomer()).
 */
export async function resolveAdmin(): Promise<AdminIdentity | null> {
	return resolveAllowlistedCustomer(process.env.ADMIN_USER_IDS);
}
