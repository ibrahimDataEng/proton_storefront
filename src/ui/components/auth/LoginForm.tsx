"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";

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
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
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
				setError(t(`errors.${code}` , { defaultValue: t("errors.unknown") }));
				return;
			}

			if (data.user) setUser(data.user);
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
				<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{error}
				</p>
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
