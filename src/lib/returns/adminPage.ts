import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { resolveAdmin, type AdminIdentity } from "@/lib/admin";

/**
 * Page-level gate for /admin/returns/*: logged out → the login page; logged in
 * but not an allowlisted, active, non-staff admin → the generic not-found view,
 * so the page never reveals that it exists. Server actions re-check
 * resolveAdmin() themselves — this gate only protects rendering.
 */
export async function requireAdminPage(locale: string, channel: string): Promise<AdminIdentity> {
	const cookieStore = await cookies();
	if (!cookieStore.get(COOKIE_ACCESS_TOKEN)?.value) {
		redirect(`/${locale}/${channel}/login`);
	}
	const admin = await resolveAdmin();
	if (!admin) notFound();
	return admin;
}
