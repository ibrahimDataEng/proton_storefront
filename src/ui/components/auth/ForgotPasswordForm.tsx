"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import {
	validateForgotPassword,
	VALIDATION_MESSAGE_KEYS,
	type AuthValidationReason,
} from "@/lib/validation/auth";

type Props = {
	onBack: () => void;
};

export function ForgotPasswordForm({ onBack }: Props) {
	const t = useTranslations("auth");
	const params = useParams<{ channel?: string }>();
	const channel = params.channel ?? "default-channel";
	const locale = useLocale();

	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailError, setEmailError] = useState<AuthValidationReason | undefined>();
	const [submitted, setSubmitted] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);
		// Only the email's syntax is checked here. Any well-formed address still
		// shows the success state below, whether or not it has an account.
		const reason = validateForgotPassword({ email }).email;
		setEmailError(reason);
		if (reason) return;

		setError(null);
		setLoading(true);

		try {
			const resetPasswordPath = `/${locale}/${encodeURIComponent(channel)}/reset-password`;
			const redirectUrl =
				typeof window !== "undefined" ? `${window.location.origin}${resetPasswordPath}` : resetPasswordPath;

			await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, redirectUrl, channel }),
			});

			// Always show success — never leak whether email exists
			setSent(true);
		} catch {
			setError(t("errors.unknown"));
		} finally {
			setLoading(false);
		}
	}

	if (sent) {
		return (
			<div className="flex flex-col gap-4 text-center">
				<p className="text-sm text-content-primary">{t("resetEmailSent")}</p>
				<button
					type="button"
					onClick={onBack}
					className="text-sm text-content-secondary underline-offset-2 hover:underline"
				>
					{t("backToLogin")}
				</button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{error && (
				<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
			)}
			<AuthFormField
				id="forgot-email"
				label={t("email")}
				type="email"
				autoComplete="email"
				required
				value={email}
				onChange={(e) => {
					setEmail(e.target.value);
					setError(null);
				}}
				onBlur={() => {
					if (submitted) setEmailError(validateForgotPassword({ email }).email);
				}}
				error={emailError ? t(VALIDATION_MESSAGE_KEYS[emailError]) : undefined}
			/>
			<Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
				{t("sendResetLink")}
			</Button>
			<button
				type="button"
				onClick={onBack}
				className="text-sm text-content-secondary underline-offset-2 hover:underline"
			>
				{t("backToLogin")}
			</button>
		</form>
	);
}
