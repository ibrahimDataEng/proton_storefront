import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/ui/components/Container";
import { SetPasswordForm } from "@/ui/components/auth/SetPasswordForm";
import { resolveAuthenticatedUser } from "@/lib/identity";

export default async function ResetPasswordPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await props.params;
	const authenticatedUser = await resolveAuthenticatedUser();
	if (authenticatedUser) {
		redirect(`/${locale}/${channel}`);
	}

	const t = await getTranslations("auth");

	return (
		<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
			<Container>
				<div className="mx-auto w-full max-w-md">
					<h1 className="mb-8 text-center text-2xl font-semibold text-content-primary">
						{t("resetPassword")}
					</h1>
					<div className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
						{/* Suspense required: SetPasswordForm reads useSearchParams() */}
						<Suspense fallback={null}>
							<SetPasswordForm />
						</Suspense>
					</div>
				</div>
			</Container>
		</main>
	);
}
