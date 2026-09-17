import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/ui/components/auth/AuthPageShell";
import { AuthFormWrapper } from "@/ui/components/auth/AuthFormWrapper";
import { resolveAuthenticatedUser } from "@/lib/identity";

export default async function RegisterPage(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;
	const authenticatedUser = await resolveAuthenticatedUser();
	if (authenticatedUser) {
		redirect(`/${locale}/${channel}`);
	}

	const t = await getTranslations("auth");

	return (
		<AuthPageShell title={t("register")}>
			<AuthFormWrapper mode="register" />
		</AuthPageShell>
	);
}
