"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";

type FormState = "idle" | "loading" | "success" | "error";

export function ChangePasswordForm() {
	const t = useTranslations("auth");

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [formState, setFormState] = useState<FormState>("idle");
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	function validate(): boolean {
		const errors: Record<string, string> = {};

		if (newPassword.length < 8) {
			errors.newPassword = t("errors.PASSWORD_TOO_SHORT");
		}
		if (newPassword === currentPassword && newPassword.length > 0) {
			errors.newPassword = t("errors.PASSWORD_SAME");
		}
		if (confirmNewPassword !== newPassword) {
			errors.confirmNewPassword = t("errors.PASSWORD_MISMATCH");
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setErrorMsg(null);

		if (!validate()) return;

		setFormState("loading");

		try {
			const res = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
			});

			const data = (await res.json()) as { ok?: boolean; error?: string };

			if (!res.ok || !data.ok) {
				const code = data.error ?? "unknown";
				setErrorMsg(resolveErrorMessage(t, code));
				setFormState("error");
				return;
			}

			setFormState("success");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");

			setTimeout(() => setFormState("idle"), 3000);
		} catch {
			setErrorMsg(t("errors.unknown"));
			setFormState("error");
		}
	}

	const isLoading = formState === "loading";

	// Any edit makes the last server response stale.
	function clearServerError() {
		setErrorMsg(null);
		if (formState === "error") setFormState("idle");
	}

	if (formState === "success") {
		return (
			<p
				role="status"
				className="rounded-md bg-brand-primary/10 px-4 py-3 text-sm font-medium text-brand-primary"
			>
				{t("passwordChanged")}
			</p>
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{(formState === "error" || errorMsg) && (
				<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{errorMsg}
				</p>
			)}

			<AuthFormField
				id="current-password"
				label={t("currentPassword")}
				type="password"
				autoComplete="current-password"
				required
				value={currentPassword}
				onChange={(e) => {
					setCurrentPassword(e.target.value);
					clearServerError();
				}}
				disabled={isLoading}
				error={fieldErrors.currentPassword}
			/>
			<AuthFormField
				id="new-password"
				label={t("newPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={newPassword}
				onChange={(e) => {
					setNewPassword(e.target.value);
					clearServerError();
				}}
				disabled={isLoading}
				error={fieldErrors.newPassword}
			/>
			<AuthFormField
				id="confirm-new-password"
				label={t("confirmNewPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={confirmNewPassword}
				onChange={(e) => {
					setConfirmNewPassword(e.target.value);
					clearServerError();
				}}
				disabled={isLoading}
				error={fieldErrors.confirmNewPassword}
			/>

			<Button type="submit" variant="primary" size="md" loading={isLoading} className="w-full sm:w-auto">
				{t("changePassword")}
			</Button>
		</form>
	);
}
