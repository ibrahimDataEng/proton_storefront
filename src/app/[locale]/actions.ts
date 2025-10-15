"use server";

import { getServerAuthClient } from "@/app/[locale]/config";

export async function logout() {
	"use server";
	(await getServerAuthClient()).signOut();
}
