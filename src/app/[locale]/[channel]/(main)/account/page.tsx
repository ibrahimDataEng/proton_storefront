import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";
import { ChangePasswordForm } from "@/ui/components/auth/ChangePasswordForm";
import { SignOutButton } from "@/ui/components/auth/SignOutButton";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";

export default async function AccountPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

	if (!token) {
		redirect("/login");
	}

	let user = { id: "", email: "", firstName: "", lastName: "" };
	try {
		const payload = decodeJwtPayload(token);
		user = {
			id: (payload["user_id"] as string | undefined) ?? "",
			email: payload.email ?? "",
			firstName: (payload["first_name"] as string | undefined) ?? "",
			lastName: (payload["last_name"] as string | undefined) ?? "",
		};
	} catch {
		redirect("/login");
	}

	const t = await getTranslations("auth");

	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
	const initials =
		[user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
		user.email[0]?.toUpperCase() ||
		"U";

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
					{/* Sidebar */}
					<aside className="w-full shrink-0 lg:w-64">
						<div className="space-y-4 rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
							<div className="flex flex-col items-center gap-3">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-2xl font-bold text-content-inverse">
									{initials}
								</div>
								<div className="text-center">
									{fullName && <p className="text-base font-semibold text-content-primary">{fullName}</p>}
									<p className="text-sm text-content-secondary">{user.email}</p>
								</div>
							</div>
							<SignOutButton label={t("signOut")} />
						</div>
					</aside>

					{/* Main */}
					<div className="flex flex-1 flex-col gap-8">
						<section className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
							<h2 className="mb-4 text-lg font-semibold text-content-primary">{t("accountInfo")}</h2>
							<dl className="flex flex-col gap-4">
								<div className="flex flex-col gap-0.5">
									<dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
										{t("firstName")}
									</dt>
									<dd className="text-sm text-content-primary">{user.firstName || "—"}</dd>
								</div>
								<div className="flex flex-col gap-0.5">
									<dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
										{t("lastName")}
									</dt>
									<dd className="text-sm text-content-primary">{user.lastName || "—"}</dd>
								</div>
								<div className="flex flex-col gap-0.5">
									<dt className="text-xs font-medium uppercase tracking-wide text-content-secondary">
										{t("email")}
									</dt>
									<dd className="text-sm text-content-primary">{user.email}</dd>
								</div>
							</dl>
						</section>

						<section className="rounded-2xl bg-surface-base p-6 shadow-sm ring-1 ring-line-subtle">
							<h2 className="mb-4 text-lg font-semibold text-content-primary">{t("changePassword")}</h2>
							<ChangePasswordForm />
						</section>
					</div>
				</div>
			</Container>
		</main>
	);
}
