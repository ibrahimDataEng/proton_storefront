import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { ConfirmAccountClient } from "@/ui/components/auth/ConfirmAccountClient";

export default async function ConfirmAccountPage() {
	const t = await getTranslations("confirmAccount");

	return (
		<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
			<Container>
				<div className="mx-auto w-full max-w-md">
					<h1 className="mb-8 text-center text-2xl font-semibold text-content-primary">{t("pageTitle")}</h1>
					<div className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
						{/* Suspense required: ConfirmAccountClient reads useSearchParams() */}
						<Suspense fallback={null}>
							<ConfirmAccountClient />
						</Suspense>
					</div>
				</div>
			</Container>
		</main>
	);
}
