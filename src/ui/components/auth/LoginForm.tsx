"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";
import { getPendingPhone, clearPendingPhone } from "@/lib/auth/pendingPhone";

type Props = {
	onForgotPassword: () => void;
};

export function LoginForm({ onForgotPassword }: Props) {
	const t = useTranslations("auth");
	const router = useRouter();
	const { closeAuthModal, setUser } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setErrorCode(null);
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = (await res.json()) as { user?: AuthUser; error?: string };

			if (!res.ok || data.error) {
				const code = data.error ?? "unknown";
				setErrorCode(code);
				setError(t(`errors.${code}`, { defaultValue: t("errors.unknown") }));
				return;
			}

			if (data.user) setUser(data.user);

			// Best-effort flush of a phone value carried over from a registration that
			// couldn't write it at the time (see RegisterForm.tsx / pendingPhone.ts —
			// this covers both the confirmation-required path, which never had a token
			// to write with, and a prior same-device write that failed). Fire-and-forget
			// and silent: no banner here, unlike RegisterForm's own failure path — if
			// this doesn't succeed, PhoneGate takes over the very next time it checks
			// phone-status for this user, so there is nothing actionable to tell them
			// right now.
			const pendingPhone = getPendingPhone(email);
			if (pendingPhone) {
				void fetch("/api/identity/set-phone", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ phone: pendingPhone }),
				})
					.then(async (r) => {
						const d = (await r.json().catch(() => null)) as { outcome?: string } | null;
						if (r.ok && d?.outcome === "success") clearPendingPhone(email);
					})
					.catch(() => {
						// Network failure reaching our own route — leave the pending entry;
						// PhoneGate remains the guaranteed fallback regardless.
					});
			}

			closeAuthModal();
			router.push("/");
			router.refresh();
		} catch {
			setError(t("errors.unknown"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{error && (
				<div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					<p>{error}</p>
					{errorCode === "LOGIN_ATTEMPT_DELAYED" && (
						<button
							type="button"
							onClick={onForgotPassword}
							className="mt-1 font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
						>
							{t("forgotPassword")}
						</button>
					)}
				</div>
			)}
			<AuthFormField
				id="login-email"
				label={t("email")}
				type="email"
				autoComplete="email"
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<AuthFormField
				id="login-password"
				label={t("password")}
				type="password"
				autoComplete="current-password"
				required
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			<button
				type="button"
				onClick={onForgotPassword}
				className="self-start text-xs text-content-secondary underline-offset-2 hover:underline"
			>
				{t("forgotPassword")}
			</button>
			<Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
				{t("login")}
			</Button>
		</form>
	);
}
