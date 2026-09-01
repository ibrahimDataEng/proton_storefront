import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { DeleteAccountConfirm } from "@/ui/components/account/DeleteAccountConfirm";

export default async function DeleteAccountPage() {
	const t = await getTranslations("accountDeletion");

	return (
		<main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
			<Container>
				<div className="mx-auto w-full max-w-md">
					<h1 className="mb-8 text-center text-2xl font-semibold text-content-primary">{t("pageTitle")}</h1>
					<div className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
						{/* Suspense required: DeleteAccountConfirm reads useSearchParams() */}
						<Suspense fallback={null}>
							<DeleteAccountConfirm />
						</Suspense>
					</div>
				</div>
			</Container>
		</main>
	);
}
