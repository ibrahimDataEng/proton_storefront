"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
import { savePendingPhone, clearPendingPhone } from "@/lib/auth/pendingPhone";
import { notifyPhoneSaveFailed } from "@/lib/auth/phoneSaveNotice";
import {
	hasErrors,
	validateRegister,
	VALIDATION_MESSAGE_KEYS,
	type FieldErrors,
} from "@/lib/validation/auth";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";

type RegisterField = "email" | "password" | "confirmPassword";

type Props = {
	onConfirmationRequired: () => void;
};

export function RegisterForm({ onConfirmationRequired }: Props) {
	const t = useTranslations("auth");
	const tField = useTranslations("phoneField");
	const router = useRouter();
	const params = useParams<{ channel?: string }>();
	const channel = params.channel ?? "default-channel";
	const locale = useLocale();
	const { closeAuthModal, setUser } = useAuth();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [phone, setPhone] = useState<PhoneFieldValues>(EMPTY_PHONE_VALUES);
	const [phoneError, setPhoneError] = useState<string | undefined>();
	const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);

	// Runs on submit, then per-field on blur once the user has tried to submit.
	// Email and confirm-password are required too (an empty confirm used to pass
	// because "" === ""), so invalid input never reaches /api/auth/register.
	function currentFieldErrors() {
		return validateRegister({ email, password, confirmPassword });
	}

	function validateField(field: RegisterField) {
		if (!submitted) return;
		const next = currentFieldErrors();
		setFieldErrors((prev) => ({ ...prev, [field]: next[field] }));
	}

	function fieldErrorText(field: RegisterField) {
		const reason = fieldErrors[field];
		return reason ? t(VALIDATION_MESSAGE_KEYS[reason]) : undefined;
	}

	/** Every field edit makes the last server response stale. */
	function withBannerClear<T>(setter: (value: T) => void) {
		return (value: T) => {
			setter(value);
			setFormError(null);
		};
	}

	// Phone is required (see below), but — unlike password — never blocks
	// registration itself: accountRegister has no phone field at all (see the
	// registration-flow diagnostic in CLAUDE.md), so the phone write is always a
	// separate post-login step (submitPhoneAfterAuth below / PhoneGate as the
	// eventual fallback). An invalid phone here only ever produces an inline error
	// for the user's benefit; it never stops the account from being created.
	function validatePhoneForDisplay(): string | undefined {
		const result = validatePhoneFields(phone);
		if (!result) return undefined;
		return result === "required" ? tField("required") : tField("invalid");
	}

	/**
	 * Fire-and-forget: called after the auto-login (confirmation-disabled) path
	 * already has a token. Never awaited by handleSubmit — the user must not wait on
	 * proton_identity to finish registering (see identity.ts's 3s timeout on the
	 * server side; this is the client-side half of that same "never block" design).
	 * On any non-success outcome: leave the value in pendingPhone (a future login can
	 * still retry it) and surface the generic, non-blocking banner — PhoneGate is the
	 * actual safety net that guarantees this gets collected eventually.
	 *
	 * Uses notifyPhoneSaveFailed() (a window event), not AuthContext, to report the
	 * failure — confirmed live that this promise routinely resolves *after*
	 * router.push+router.refresh() below have already remounted AuthProvider, which
	 * silently drops a context setter captured before that remount. See
	 * phoneSaveNotice.ts.
	 */
	async function submitPhoneAfterAuth(userEmail: string, combinedPhone: string): Promise<void> {
		try {
			const res = await fetch("/api/identity/set-phone", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone: combinedPhone }),
			});
			const data = (await res.json().catch(() => null)) as { outcome?: string } | null;
			if (res.ok && data?.outcome === "success") {
				clearPendingPhone(userEmail);
				return;
			}
			savePendingPhone(userEmail, combinedPhone);
			notifyPhoneSaveFailed();
		} catch {
			savePendingPhone(userEmail, combinedPhone);
			notifyPhoneSaveFailed();
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);
		setPhoneError(validatePhoneForDisplay());
		const errors = currentFieldErrors();
		setFieldErrors(errors);
		if (hasErrors(errors)) return;

		setFormError(null);
		setLoading(true);

		try {
			const confirmAccountPath = `/${locale}/${encodeURIComponent(channel)}/confirm-account`;
			const redirectUrl =
				typeof window !== "undefined" ? `${window.location.origin}${confirmAccountPath}` : confirmAccountPath;

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
				setFormError(resolveErrorMessage(t, data.error ?? "unknown"));
				return;
			}

			// Only attempt to carry the phone forward if it actually passed client-side
			// validation — an obviously-malformed value is left unsaved rather than
			// spent on a doomed network/localStorage round-trip; PhoneGate still ends up
			// asking for it on the next login either way.
			const phoneIsUsable = !validatePhoneFields(phone);
			const combinedPhone = phoneIsUsable ? combinePhone(phone) : null;

			if (data.requiresConfirmation) {
				// No access token exists yet — accountRegister has no phone field, and
				// nothing can be written to proton_identity until this user actually logs
				// in post-confirmation (a separate page load, possibly a different
				// device). Best-effort same-device carry via pendingPhone; PhoneGate is
				// the guaranteed fallback regardless — see pendingPhone.ts.
				if (combinedPhone) savePendingPhone(email, combinedPhone);
				onConfirmationRequired();
				return;
			}

			if (data.user) {
				setUser(data.user);
				// Fire-and-forget — see submitPhoneAfterAuth's own doc comment for why
				// this is never awaited here.
				if (combinedPhone) void submitPhoneAfterAuth(email, combinedPhone);
			}
			closeAuthModal();
			router.push(`/${locale}/${channel}`);
			router.refresh();
		} catch {
			setFormError(t("errors.unknown"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
			{formError && (
				<p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
					{formError}
				</p>
			)}
			<div className="grid grid-cols-2 gap-3">
				<AuthFormField
					id="reg-first-name"
					label={t("firstName")}
					type="text"
					autoComplete="given-name"
					value={firstName}
					onChange={(e) => withBannerClear(setFirstName)(e.target.value)}
				/>
				<AuthFormField
					id="reg-last-name"
					label={t("lastName")}
					type="text"
					autoComplete="family-name"
					value={lastName}
					onChange={(e) => withBannerClear(setLastName)(e.target.value)}
				/>
			</div>
			<PhoneField
				id="reg-phone"
				values={phone}
				onChange={withBannerClear(setPhone)}
				onBlur={() => setPhoneError(validatePhoneForDisplay())}
				error={phoneError}
				required
			/>
			<AuthFormField
				id="reg-email"
				label={t("email")}
				type="email"
				autoComplete="email"
				required
				value={email}
				onChange={(e) => withBannerClear(setEmail)(e.target.value)}
				onBlur={() => validateField("email")}
				error={fieldErrorText("email")}
			/>
			<AuthFormField
				id="reg-password"
				label={t("password")}
				type="password"
				autoComplete="new-password"
				required
				value={password}
				onChange={(e) => withBannerClear(setPassword)(e.target.value)}
				onBlur={() => validateField("password")}
				error={fieldErrorText("password")}
			/>
			<AuthFormField
				id="reg-confirm-password"
				label={t("confirmPassword")}
				type="password"
				autoComplete="new-password"
				required
				value={confirmPassword}
				onChange={(e) => withBannerClear(setConfirmPassword)(e.target.value)}
				onBlur={() => validateField("confirmPassword")}
				error={fieldErrorText("confirmPassword")}
			/>
			<Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
				{t("register")}
			</Button>
		</form>
	);
}
