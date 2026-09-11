"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { AuthFormField } from "./AuthFormField";
import {
	PhoneField,
	EMPTY_PHONE_VALUES,
	combinePhone,
	validatePhoneFields,
	type PhoneFieldValues,
} from "./PhoneField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";
import { getPendingPhone, clearPendingPhone } from "@/lib/auth/pendingPhone";

type Props = {
	onForgotPassword: () => void;
};

type LoginMode = "email" | "phone";
type PhoneStep = "enter-phone" | "enter-code";

/** Matches proton_identity's own resend-cooldown window exactly — see that service's
 * README for why 60s. Kept as a client-side countdown purely for UX (disabling the
 * button so a confused user can't hammer it); the real limit is enforced server-side
 * regardless, and /api/otp/send's own "rate_limited" outcome is still handled if this
 * client-side guess and the server's actual state ever drift. */
const RESEND_COOLDOWN_SECONDS = 60;

export function LoginForm({ onForgotPassword }: Props) {
	const t = useTranslations("auth");
	const tPhoneLogin = useTranslations("phoneLogin");
	const tField = useTranslations("phoneField");
	const router = useRouter();
	const { closeAuthModal, setUser } = useAuth();

	const [loginMode, setLoginMode] = useState<LoginMode>("email");

	// Email/password state
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Phone/OTP state
	const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter-phone");
	const [phone, setPhone] = useState<PhoneFieldValues>(EMPTY_PHONE_VALUES);
	const [phoneFieldError, setPhoneFieldError] = useState<string | undefined>();
	const [sendingCode, setSendingCode] = useState(false);
	const [code, setCode] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [showSwitchToEmail, setShowSwitchToEmail] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const sentPhoneRef = useRef("");

	useEffect(() => {
		if (cooldown <= 0) return;
		const interval = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
		return () => clearInterval(interval);
	}, [cooldown]);

	// Shared tail end of every successful login (email or phone) — same state update,
	// same pendingPhone flush, same modal-close/redirect. Do not fork this per login
	// method; that's exactly the "parallel path" this is written to avoid.
	const completeLogin = useCallback(
		async (user: AuthUser, loggedInEmail: string) => {
			setUser(user);

			const pendingPhone = getPendingPhone(loggedInEmail);
			if (pendingPhone) {
				void fetch("/api/identity/set-phone", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ phone: pendingPhone }),
				})
					.then(async (r) => {
						const d = (await r.json().catch(() => null)) as { outcome?: string } | null;
						if (r.ok && d?.outcome === "success") clearPendingPhone(loggedInEmail);
					})
					.catch(() => {
						// Network failure reaching our own route — leave the pending entry;
						// PhoneGate remains the guaranteed fallback regardless.
					});
			}

			closeAuthModal();
			router.push("/");
			router.refresh();
		},
		[setUser, closeAuthModal, router],
	);

	async function handleEmailSubmit(e: React.FormEvent) {
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

			if (data.user) await completeLogin(data.user, email);
		} catch {
			setError(t("errors.unknown"));
		} finally {
			setLoading(false);
		}
	}

	// Shared by the initial "Send code" submit and the later "Resend code" click —
	// both hit the same route the same way, only the trigger differs.
	async function sendCode(combined: string) {
		setPhoneError(null);
		setShowSwitchToEmail(false);
		setSendingCode(true);

		try {
			const res = await fetch("/api/otp/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone: combined }),
			});
			const data = (await res.json().catch(() => null)) as { outcome?: string } | null;

			if (res.ok && data?.outcome === "sent") {
				sentPhoneRef.current = combined;
				setPhoneStep("enter-code");
				setCooldown(RESEND_COOLDOWN_SECONDS);
				return;
			}
			if (data?.outcome === "invalid_phone") {
				setPhoneFieldError(tField("invalid"));
				return;
			}
			if (data?.outcome === "rate_limited") {
				setPhoneError(tPhoneLogin("errors.rateLimited"));
				setCooldown(RESEND_COOLDOWN_SECONDS);
				return;
			}
			// service_error, or anything else unexpected — same non-blocking-of-email
			// treatment either way: surface a clear message and an escape hatch back to
			// the email tab, never a dead end.
			setPhoneError(tPhoneLogin("errors.serviceUnavailable"));
			setShowSwitchToEmail(true);
		} catch {
			setPhoneError(tPhoneLogin("errors.serviceUnavailable"));
			setShowSwitchToEmail(true);
		} finally {
			setSendingCode(false);
		}
	}

	async function handleSendCodeSubmit(e: React.FormEvent) {
		e.preventDefault();
		const validation = validatePhoneFields(phone);
		if (validation) {
			setPhoneFieldError(validation === "required" ? tField("required") : tField("invalid"));
			return;
		}
		setPhoneFieldError(undefined);
		await sendCode(combinePhone(phone));
	}

	function handleResend() {
		if (cooldown > 0 || sendingCode) return;
		void sendCode(sentPhoneRef.current);
	}

	async function handleVerifyCode(e: React.FormEvent) {
		e.preventDefault();
		setPhoneError(null);
		setVerifying(true);

		try {
			const res = await fetch("/api/auth/phone-login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone: sentPhoneRef.current, code: code.trim() }),
			});
			const data = (await res.json()) as { user?: AuthUser; error?: string };

			// Deliberately the same generic message regardless of why this failed
			// (wrong code, expired code, unregistered phone) — see phone-login/route.ts's
			// own comment for why that ambiguity must survive to the UI, not be undone
			// here.
			if (!res.ok || data.error || !data.user) {
				setPhoneError(tPhoneLogin("errors.invalidOrExpiredCode"));
				return;
			}

			await completeLogin(data.user, data.user.email);
		} catch {
			setPhoneError(tPhoneLogin("errors.invalidOrExpiredCode"));
		} finally {
			setVerifying(false);
		}
	}

	function handleChangeNumber() {
		setPhoneStep("enter-phone");
		setCode("");
		setPhoneError(null);
		setShowSwitchToEmail(false);
		// Reset, not preserved: the 60s cooldown is scoped server-side to a specific
		// phone number, so it must not carry over to whatever number gets entered
		// next. If it's actually the same number resubmitted too soon, /api/otp/send
		// still reports "rate_limited" and re-arms this cooldown correctly.
		setCooldown(0);
	}

	function switchMode(mode: LoginMode) {
		setLoginMode(mode);
		// Clear the other mode's stale error state so it doesn't linger if the user
		// switches back later.
		setError(null);
		setErrorCode(null);
		setPhoneError(null);
		setPhoneFieldError(undefined);
	}

	const modeTabs: { key: LoginMode; label: string }[] = [
		{ key: "email", label: t("email") },
		{ key: "phone", label: tPhoneLogin("tabLabel") },
	];

	return (
		<div className="flex flex-col gap-4">
			<div role="tablist" className="flex rounded-lg border border-line-default p-1">
				{modeTabs.map(({ key, label }) => (
					<button
						key={key}
						role="tab"
						aria-selected={loginMode === key}
						type="button"
						onClick={() => switchMode(key)}
						className={clsx(
							"flex-1 rounded-md py-2 text-sm font-medium transition-colors",
							loginMode === key
								? "bg-brand-primary text-content-inverse"
								: "text-content-secondary hover:text-content-primary",
						)}
					>
						{label}
					</button>
				))}
			</div>

			{loginMode === "email" ? (
				<form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-4">
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
			) : phoneStep === "enter-phone" ? (
				<form onSubmit={handleSendCodeSubmit} noValidate className="flex flex-col gap-4">
					{phoneError && (
						<div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
							<p>{phoneError}</p>
							{showSwitchToEmail && (
								<button
									type="button"
									onClick={() => switchMode("email")}
									className="mt-1 font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
								>
									{tPhoneLogin("switchToEmail")}
								</button>
							)}
						</div>
					)}
					<PhoneField id="login-phone" values={phone} onChange={setPhone} error={phoneFieldError} required />
					<Button
						type="submit"
						variant="primary"
						size="md"
						loading={sendingCode}
						disabled={cooldown > 0}
						className="w-full"
					>
						{tPhoneLogin("sendCode")}
					</Button>
				</form>
			) : (
				<form onSubmit={handleVerifyCode} noValidate className="flex flex-col gap-4">
					{phoneError && (
						<div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
							{phoneError}
						</div>
					)}
					<p className="text-sm text-content-secondary">
						{tPhoneLogin("codeSentTo", { phone: sentPhoneRef.current })}
					</p>
					<AuthFormField
						id="login-otp-code"
						label={tPhoneLogin("codeLabel")}
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						required
						value={code}
						onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
					/>
					<Button
						type="submit"
						variant="primary"
						size="md"
						loading={verifying}
						disabled={code.length !== 6}
						className="w-full"
					>
						{tPhoneLogin("verifyAndSignIn")}
					</Button>
					<div className="flex items-center justify-between text-xs">
						<button
							type="button"
							onClick={handleChangeNumber}
							className="text-content-secondary underline-offset-2 hover:underline"
						>
							{tPhoneLogin("changeNumber")}
						</button>
						<button
							type="button"
							onClick={handleResend}
							disabled={cooldown > 0 || sendingCode}
							className="text-content-secondary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
						>
							{cooldown > 0 ? tPhoneLogin("resendIn", { seconds: cooldown }) : tPhoneLogin("resendCode")}
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
