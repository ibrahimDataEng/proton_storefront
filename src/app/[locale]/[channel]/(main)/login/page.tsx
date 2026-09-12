import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/ui/components/auth/AuthPageShell";
import { AuthFormWrapper } from "@/ui/components/auth/AuthFormWrapper";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

export default async function LoginPage() {
	const cookieStore = await cookies();
	if (cookieStore.get(COOKIE_ACCESS_TOKEN)?.value) {
		redirect("/");
	}

	const t = await getTranslations("auth");

	return (
		<AuthPageShell title={t("login")}>
			<AuthFormWrapper mode="login" />
		</AuthPageShell>
	);
}
