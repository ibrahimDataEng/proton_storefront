"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";

export function SetPasswordForm() {
	const t = useTranslations("auth");
	const router = useRouter();
	const searchParams = useSearchParams();
	const params = useParams();
	const channel = (params.channel as string) ?? "";
	const locale = (params.locale as string) ?? "en";
	const { setUser } = useAuth();

	const token = searchParams.get("token") ?? "";
	const email = searchParams.get("email") ?? "";

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [tokenInvalid, setTokenInvalid] = useState(false);

	if (!token || !email) {
		return (
			<p role="alert" className="text-center text-sm text-content-secondary">
				{t("invalidResetLink")}
			</p>
		);
	}

	if (tokenInvalid) {
		return (
			<div className="flex flex-col gap-4 text-center">
				<p role="alert" className="text-sm text-content-primary">
					{t("expiredResetLink")}
				</p>
				<LinkWithChannel
					href="/login"
					className="text-sm text-brand-primary underline-offset-2 hover:underline"
				>
					{t("requestNewLink")}
				</LinkWithChannel>
			</div>
		);
	}

	if (success) {
		return <p className="text-center text-sm text-content-secondary">{t("passwordUpdated")}</p>;
	}

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (password.length < 8) next.password = t("errors.PASSWORD_TOO_SHORT");
		if (password !== confirmPassword) next.confirmPassword = t("errors.PASSWORD_MISMATCH");
		setFieldErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;

		setFieldErrors({});
		setFormError(null);
		setLoading(true);

		try {
			const res = await fetch("/api/auth/set-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, token, password }),
			});

			const data = (await res.json()) as { user?: AuthUser; error?: string };

			if (!res.ok || data.error) {
				const code = data.error ?? "unknown";
				if (code === "TOKEN_INVALID") {
					setTokenInvalid(true);
					return;
				}
				setFormError(resolveErrorMessage(t, code));
				return;
			}

			if (data.user) setUser(data.user);
			setSuccess(true);
			setTimeout(() => {
				router.push(`/${locale}/${channel}`);
				router.refresh();
			}, 1500);
		} catch {
			setFormError(t("errors.unknown"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{formError && (
				<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{formError}
				</p>
			)}
			<AuthFormField
				id="reset-new-password"
				label={t("newPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				error={fieldErrors.password}
			/>
			<AuthFormField
				id="reset-confirm-password"
				label={t("confirmPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				error={fieldErrors.confirmPassword}
			/>
			<Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
				{t("setPassword")}
			</Button>
		</form>
	);
}
