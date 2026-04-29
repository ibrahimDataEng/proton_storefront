"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { AuthFormField } from "@/ui/components/auth/AuthFormField";
import { ChangePasswordForm } from "@/ui/components/auth/ChangePasswordForm";
import { updateAccount } from "@/app/[locale]/[channel]/(main)/account/actions";
import type { CurrentUserOrderListQuery } from "@/gql/graphql";

type UserData = NonNullable<CurrentUserOrderListQuery["me"]>;

interface Props {
	user: UserData;
}

export function SettingsSection({ user }: Props) {
	const t = useTranslations("account");
	const tAuth = useTranslations("auth");
	const router = useRouter();

	const [firstName, setFirstName] = useState(user.firstName ?? "");
	const [lastName, setLastName] = useState(user.lastName ?? "");
	const [saving, setSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
	const [saveError, setSaveError] = useState<string | null>(null);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setSaveStatus("idle");
		setSaveError(null);
		const result = await updateAccount({ firstName, lastName });
		setSaving(false);
		if (!result.ok) {
			setSaveError(result.error ?? "Error saving");
			setSaveStatus("error");
			return;
		}
		setSaveStatus("success");
		router.refresh();
		setTimeout(() => setSaveStatus("idle"), 2500);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Personal info card */}
			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-5 text-base font-semibold text-content-primary">{t("personalInfo")}</h2>
				<form onSubmit={handleSave} className="flex flex-col gap-4">
					{saveError && (
						<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
							{saveError}
						</p>
					)}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<AuthFormField
							id="settings-firstName"
							label={tAuth("firstName")}
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							disabled={saving}
						/>
						<AuthFormField
							id="settings-lastName"
							label={tAuth("lastName")}
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							disabled={saving}
						/>
					</div>
					<AuthFormField
						id="settings-email"
						label={tAuth("email")}
						type="email"
						value={user.email}
						readOnly
						disabled
						className="cursor-not-allowed opacity-60"
					/>
					<div className="flex items-center gap-3">
						<button
							type="submit"
							disabled={saving}
							className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
						>
							{saveStatus === "success" ? (
								<>
									<Check className="h-4 w-4" aria-hidden="true" />
									{t("saved")}
								</>
							) : (
								t("saveChanges")
							)}
						</button>
					</div>
				</form>
			</div>

			{/* Security card */}
			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-5 text-base font-semibold text-content-primary">{t("security")}</h2>
				<ChangePasswordForm />
			</div>
		</div>
	);
}
