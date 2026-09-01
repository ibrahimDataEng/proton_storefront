"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthView = "login" | "register" | "forgot" | "confirmation";

type Props = {
	mode: "login" | "register";
	onModeChange?: (mode: "login" | "register") => void;
};

export function AuthFormWrapper({ mode, onModeChange = () => {} }: Props) {
	const t = useTranslations("auth");
	const [view, setView] = useState<AuthView>(mode);

	// Keep view in sync when mode prop changes (modal mode switch)
	const effectiveView: AuthView = view === "forgot" || view === "confirmation" ? view : mode;

	const tabs: { key: "login" | "register"; label: string }[] = [
		{ key: "login", label: t("login") },
		{ key: "register", label: t("register") },
	];

	if (effectiveView === "forgot") {
		return (
			<div className="flex flex-col gap-6">
				<h2 id="auth-modal-title" className="text-xl font-semibold text-content-primary">
					{t("forgotPassword")}
				</h2>
				<ForgotPasswordForm
					onBack={() => {
						setView("login");
						onModeChange("login");
					}}
				/>
			</div>
		);
	}

	if (effectiveView === "confirmation") {
		return (
			<div className="flex flex-col gap-6 text-center">
				<h2 id="auth-modal-title" className="text-xl font-semibold text-content-primary">
					{t("register")}
				</h2>
				<p className="text-sm text-content-secondary">{t("confirmEmailRequired")}</p>
				<button
					type="button"
					onClick={() => {
						setView("login");
						onModeChange("login");
					}}
					className="text-sm text-content-secondary underline-offset-2 hover:underline"
				>
					{t("backToLogin")}
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Tab switcher */}
			<div role="tablist" className="flex rounded-lg border border-line-default p-1">
				{tabs.map(({ key, label }) => (
					<button
						key={key}
						role="tab"
						aria-selected={mode === key}
						type="button"
						onClick={() => {
							setView(key);
							onModeChange(key);
						}}
						className={clsx(
							"flex-1 rounded-md py-2 text-sm font-medium transition-colors",
							mode === key
								? "bg-brand-primary text-content-inverse"
								: "text-content-secondary hover:text-content-primary",
						)}
					>
						{label}
					</button>
				))}
			</div>

			<h2 id="auth-modal-title" className="sr-only">
				{mode === "login" ? t("login") : t("register")}
			</h2>

			{mode === "login" ? (
				<LoginForm onForgotPassword={() => setView("forgot")} />
			) : (
				<RegisterForm onConfirmationRequired={() => setView("confirmation")} />
			)}

			<p className="text-center text-xs text-content-secondary">
				{mode === "login" ? (
					<button
						type="button"
						onClick={() => {
							setView("register");
							onModeChange("register");
						}}
						className="underline-offset-2 hover:underline"
					>
						{t("switchToRegister")}
					</button>
				) : (
					<button
						type="button"
						onClick={() => {
							setView("login");
							onModeChange("login");
						}}
						className="underline-offset-2 hover:underline"
					>
						{t("switchToLogin")}
					</button>
				)}
			</p>
		</div>
	);
}
