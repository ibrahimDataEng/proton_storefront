"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { AuthFormField } from "./AuthFormField";
import { PHONE_LIKE_PATTERN } from "./PhoneField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { type AuthUser } from "@/lib/auth/types";
import { getPendingPhone, clearPendingPhone } from "@/lib/auth/pendingPhone";
import { PHONE_LOGIN_ENABLED } from "@/lib/featureFlags";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";

type Props = {
	onForgotPassword: () => void;
};

type PhoneStep = "enter-phone" | "enter-code";
type IdentifierMode = "email" | "phone" | null;

/** Matches proton_identity's own resend-cooldown window exactly — see that service's
 * README for why 60s. Kept as a client-side countdown purely for UX (disabling the
 * button so a confused user can't hammer it); the real limit is enforced server-side
 * regardless, and /api/otp/send's own "rate_limited" outcome is still handled if this
 * client-side guess and the server's actual state ever drift. */
const RESEND_COOLDOWN_SECONDS = 60;

/** "@" always wins (treat as email) even if the value also happens to look phone-like;
 * otherwise fall back to the same digits/leading-+ pattern PhoneField itself validates
 * against, applied to the whole combined field since there's no separate country-code
 * selector here — proton_identity re-normalizes whatever gets sent, same as before. */
function detectIdentifierMode(value: string): IdentifierMode {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (trimmed.includes("@")) return "email";
	if (PHONE_LIKE_PATTERN.test(trimmed)) return "phone";
	return null;
}

const revealTransition = {
	initial: { height: 0, opacity: 0 },
	animate: { height: "auto", opacity: 1 },
	exit: { height: 0, opacity: 0 },
	transition: { duration: 0.22, ease: "easeInOut" as const },
};

export function LoginForm({ onForgotPassword }: Props) {
	const t = useTranslations("auth");
	const tPhoneLogin = useTranslations("phoneLogin");
	const router = useRouter();
	const params = useParams();
	const channel = (params.channel as string) ?? "";
	const locale = (params.locale as string) ?? "en";
	const { closeAuthModal, setUser } = useAuth();

	// The single "Email or Phone Number" field when the flag is on; a plain email
	// field when it's off (see identifierType/identifierAutoComplete/identifierLabel
	// below — those three are the only things that vary by flag on this field, and
	// keeping them flag-gated is what keeps the off-state byte-identical to before).
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Phone/OTP state — unreachable in the UI whenever PHONE_LOGIN_ENABLED is false,
	// since `mode` can then never be "phone". Left in place (not stripped) so the
	// flag flips back on with zero code changes, per this session's brief.
	const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter-phone");
	const [sendingCode, setSendingCode] = useState(false);
	const [code, setCode] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [phoneError, setPhoneError] = useState<string | null>(null);
	const [showEmailFallback, setShowEmailFallback] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const sentPhoneRef = useRef("");

	const mode: IdentifierMode = PHONE_LOGIN_ENABLED ? detectIdentifierMode(identifier) : "email";

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
			router.push(`/${locale}/${channel}`);
			router.refresh();
		},
		[setUser, closeAuthModal, router, locale, channel],
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
				body: JSON.stringify({ email: identifier, password }),
			});

			const data = (await res.json()) as { user?: AuthUser; error?: string };

			if (!res.ok || data.error) {
				const code = data.error ?? "unknown";
				setErrorCode(code);
				setError(resolveErrorMessage(t, code));
				return;
			}

			if (data.user) await completeLogin(data.user, identifier);
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
		setShowEmailFallback(false);
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
				setPhoneError(tPhoneLogin("errors.invalidPhone"));
				return;
			}
			if (data?.outcome === "rate_limited") {
				setPhoneError(tPhoneLogin("errors.rateLimited"));
				setCooldown(RESEND_COOLDOWN_SECONDS);
				return;
			}
			// service_error, or anything else unexpected — same non-blocking-of-email
			// treatment either way: surface a clear message and an inline "use email
			// instead" fallback (there's no tab to switch back to anymore).
			setPhoneError(tPhoneLogin("errors.serviceUnavailable"));
			setShowEmailFallback(true);
		} catch {
			setPhoneError(tPhoneLogin("errors.serviceUnavailable"));
			setShowEmailFallback(true);
		} finally {
			setSendingCode(false);
		}
	}

	async function handleSendCodeSubmit(e: React.FormEvent) {
		e.preventDefault();
		await sendCode(identifier.trim());
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
		setShowEmailFallback(false);
		// Reset, not preserved: the 60s cooldown is scoped server-side to a specific
		// phone number, so it must not carry over to whatever number gets entered
		// next. If it's actually the same number resubmitted too soon, /api/otp/send
		// still reports "rate_limited" and re-arms this cooldown correctly.
		setCooldown(0);
	}

	function handleIdentifierChange(value: string) {
		setIdentifier(value);
		// Editing the field before anything's been submitted clears stale per-mode
		// error state, so switching between an email-like and phone-like value never
		// shows a leftover error from the other path.
		if (phoneStep === "enter-phone") {
			setError(null);
			setErrorCode(null);
			setPhoneError(null);
			setShowEmailFallback(false);
		}
	}

	function handleUseEmailInstead() {
		setIdentifier("");
		setPhoneError(null);
		setShowEmailFallback(false);
	}

	function handleSubmit(e: React.FormEvent) {
		if (mode === "phone") return void handleSendCodeSubmit(e);
		if (mode === "email") return void handleEmailSubmit(e);
		e.preventDefault();
	}

	const identifierType = PHONE_LOGIN_ENABLED ? "text" : "email";
	const identifierAutoComplete = PHONE_LOGIN_ENABLED ? "username" : "email";
	const identifierInputMode = PHONE_LOGIN_ENABLED && mode === "phone" ? "tel" : undefined;
	const identifierLabel = PHONE_LOGIN_ENABLED ? tPhoneLogin("identifierLabel") : t("email");

	const showIdentifierStep = !(PHONE_LOGIN_ENABLED && mode === "phone" && phoneStep === "enter-code");

	return (
		<div className="flex flex-col gap-4">
			{showIdentifierStep && (
				<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
					{mode === "email" && error && (
						<div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
					{mode === "phone" && phoneError && (
						<div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
							<p>{phoneError}</p>
							{showEmailFallback && (
								<button
									type="button"
									onClick={handleUseEmailInstead}
									className="mt-1 font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
								>
									{tPhoneLogin("switchToEmail")}
								</button>
							)}
						</div>
					)}

					<AuthFormField
						id="login-identifier"
						label={identifierLabel}
						type={identifierType}
						autoComplete={identifierAutoComplete}
						inputMode={identifierInputMode}
						required
						value={identifier}
						onChange={(e) => handleIdentifierChange(e.target.value)}
					/>

					<AnimatePresence initial={false}>
						{mode === "email" && (
							<motion.div key="password-reveal" {...revealTransition} className="overflow-hidden">
								<div className="flex flex-col gap-4 pt-0.5">
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
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{mode !== null && (
						<Button
							type="submit"
							variant="primary"
							size="md"
							loading={mode === "email" ? loading : sendingCode}
							disabled={mode === "phone" && cooldown > 0}
							className="w-full"
						>
							{mode === "phone" ? tPhoneLogin("sendCode") : t("login")}
						</Button>
					)}
				</form>
			)}

			{PHONE_LOGIN_ENABLED && mode === "phone" && phoneStep === "enter-code" && (
				<form onSubmit={handleVerifyCode} noValidate className="flex flex-col gap-4">
					{phoneError && (
						<div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
