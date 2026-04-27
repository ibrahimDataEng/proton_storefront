import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { AuthFormWrapper } from "@/ui/components/auth/AuthFormWrapper";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

export default async function RegisterPage() {
	const cookieStore = await cookies();
	if (cookieStore.get(COOKIE_ACCESS_TOKEN)?.value) {
		redirect("/");
	}

	const t = await getTranslations("auth");

	return (
		<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
			<Container>
				<div className="mx-auto w-full max-w-md">
					<h1 className="mb-8 text-center text-2xl font-semibold text-content-primary">{t("register")}</h1>
					<div className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
						<AuthFormWrapper mode="register" onModeChange={() => undefined} />
					</div>
				</div>
			</Container>
		</main>
	);
}
