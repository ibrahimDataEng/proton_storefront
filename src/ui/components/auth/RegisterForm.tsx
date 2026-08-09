"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthFormField } from "./AuthFormField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";

type Props = {
	onConfirmationRequired: () => void;
};

export function RegisterForm({ onConfirmationRequired }: Props) {
	const t = useTranslations("auth");
	const router = useRouter();
	const params = useParams<{ channel?: string }>();
	const channel = params.channel ?? "default-channel";
	const { closeAuthModal, setUser } = useAuth();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	function validate(): boolean {
		const next: Record<string, string> = {};
		if (password.length < 8) next.password = t("errors.PASSWORD_TOO_SHORT");
		if (password !== confirmPassword) next.confirmPassword = t("errors.PASSWORD_MISMATCH");
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validate()) return;

		setErrors({});
		setLoading(true);

		try {
			const redirectUrl =
				typeof window !== "undefined" ? `${window.location.origin}/reset-password` : "/reset-password";

			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					firstName: firstName || undefined,
					lastName: lastName || undefined,
					channel,
					redirectUrl,
				}),
			});

			const data = (await res.json()) as {
				requiresConfirmation?: boolean;
				user?: AuthUser;
				error?: string;
			};

			if (!res.ok || data.error) {
				const code = data.error ?? "unknown";
				setErrors({
					form: t(`errors.${code}` , { defaultValue: t("errors.unknown") }),
				});
				return;
			}

			if (data.requiresConfirmation) {
				onConfirmationRequired();
				return;
			}

			if (data.user) setUser(data.user);
			closeAuthModal();
			router.push("/");
			router.refresh();
		} catch {
			setErrors({ form: t("errors.unknown") });
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{errors.form && (
				<p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
					{errors.form}
				</p>
			)}
			<div className="grid grid-cols-2 gap-3">
				<AuthFormField
					id="reg-first-name"
					label={t("firstName")}
					type="text"
					autoComplete="given-name"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
				/>
				<AuthFormField
					id="reg-last-name"
					label={t("lastName")}
					type="text"
					autoComplete="family-name"
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
				/>
			</div>
			<AuthFormField
				id="reg-email"
				label={t("email")}
				type="email"
				autoComplete="email"
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
			/>
			<AuthFormField
				id="reg-password"
				label={t("password")}
				type="password"
				autoComplete="new-password"
				required
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				error={errors.password}
			/>
			<AuthFormField
				id="reg-confirm-password"
				label={t("confirmPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				error={errors.confirmPassword}
			/>
			<Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
				{t("register")}
			</Button>
		</form>
	);
}
