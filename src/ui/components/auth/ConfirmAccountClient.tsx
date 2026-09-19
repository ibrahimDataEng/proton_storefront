"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AuthFormField } from "./AuthFormField";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { Button } from "@/ui/components/Button";

type State = "form" | "pending" | "success" | "error";

export function ConfirmAccountClient() {
	const t = useTranslations("confirmAccount");
	const tAuth = useTranslations("auth");
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";
	const token = searchParams.get("token") ?? "";

	const [state, setState] = useState<State>(email && token ? "form" : "error");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (password.length < 8) next.password = tAuth("errors.PASSWORD_TOO_SHORT");
		if (password !== confirmPassword) next.confirmPassword = tAuth("errors.PASSWORD_MISMATCH");
		setFieldErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;

		setFieldErrors({});
		setState("pending");

		try {
			const res = await fetch("/api/auth/confirm-account", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, token, password }),
			});
			const data = (await res.json()) as { success?: boolean; error?: string };
			setState(res.ok && data.success ? "success" : "error");
		} catch {
			setState("error");
		}
	}

	if (state === "form") {
		return (
			<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
				<p className="mb-6 text-center text-sm text-content-secondary">{t("passwordPrompt")}</p>
				<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
					<AuthFormField
						id="confirm-account-password"
						label={tAuth("password")}
						type="password"
						autoComplete="new-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						error={fieldErrors.password}
					/>
					<AuthFormField
						id="confirm-account-confirm-password"
						label={tAuth("confirmPassword")}
						type="password"
						autoComplete="new-password"
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						error={fieldErrors.confirmPassword}
					/>
					<Button type="submit" variant="primary" size="md" className="w-full">
						{t("confirmButton")}
					</Button>
				</form>
			</m.div>
		);
	}

	if (state === "pending") {
		return (
			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center gap-4 py-4 text-center"
			>
				<Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-hidden="true" />
				<p className="text-sm text-content-secondary">{t("pending")}</p>
			</m.div>
		);
	}

	if (state === "success") {
		return (
			<m.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex flex-col items-center gap-4 py-4 text-center"
			>
				<CheckCircle2 className="h-12 w-12 text-status-success" aria-hidden="true" />
				<m.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.3 }}
					className="flex flex-col items-center gap-2"
				>
					<h1 className="text-lg font-semibold text-content-primary">{t("successTitle")}</h1>
					<p className="max-w-sm text-sm text-content-secondary">{t("successSubtitle")}</p>
				</m.div>
				<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}>
					<LinkWithChannel
						href="/login"
						className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
					>
						{t("loginButton")}
					</LinkWithChannel>
				</m.div>
			</m.div>
		);
	}

	// error state — also covers a missing/malformed email or token in the URL
	return (
		<m.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="flex flex-col items-center gap-4 py-4 text-center"
		>
			<XCircle className="h-12 w-12 text-status-danger" aria-hidden="true" />
			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, duration: 0.3 }}
				className="flex flex-col items-center gap-2"
			>
				<h1 className="text-lg font-semibold text-content-primary">{t("errorTitle")}</h1>
				<p className="max-w-sm text-sm text-content-secondary">{t("errorSubtitle")}</p>
			</m.div>
			<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}>
				<LinkWithChannel
					href="/login"
					className="inline-flex h-11 items-center justify-center rounded-lg border border-line-default px-6 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
				>
					{t("loginButton")}
				</LinkWithChannel>
			</m.div>
		</m.div>
	);
}
