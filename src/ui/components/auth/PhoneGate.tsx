"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
	PhoneField,
	EMPTY_PHONE_VALUES,
	combinePhone,
	validatePhoneFields,
	type PhoneFieldValues,
} from "./PhoneField";
import { Button } from "@/ui/components/Button";
import { useAuth } from "@/ui/context/AuthContext";
import { clearPendingPhone } from "@/lib/auth/pendingPhone";

// After this many consecutive *service* failures (never for a 400/409 — those are
// the user's own input to fix, not an outage) offer a way out. "Repeatedly" per the
// design brief, not on the first blip, so a single transient hiccup doesn't
// immediately hand out an escape hatch.
const SERVICE_ERROR_DISMISS_THRESHOLD = 2;

type GateStatus = "hidden" | "checking" | "gated";
type SubmitOutcome = "invalid" | "conflict" | "service_error" | null;

export function PhoneGate() {
	const t = useTranslations("phoneGate");
	const tField = useTranslations("phoneField");
	const { user, isLoggedIn, logout } = useAuth();

	const [status, setStatus] = useState<GateStatus>("hidden");
	// Tracks which user id the phone-status check has already run for, so a
	// re-render (or setUser call with the same user) doesn't re-fire the check —
	// while a genuinely new login (different id) always does.
	const checkedForUserId = useRef<string | null>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const [values, setValues] = useState<PhoneFieldValues>(EMPTY_PHONE_VALUES);
	const [fieldError, setFieldError] = useState<string | undefined>();
	const [outcome, setOutcome] = useState<SubmitOutcome>(null);
	const [serviceErrorCount, setServiceErrorCount] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!isLoggedIn || !user?.id) {
			setStatus("hidden");
			checkedForUserId.current = null;
			return;
		}
		if (checkedForUserId.current === user.id) return;
		checkedForUserId.current = user.id;

		setStatus("checking");
		void (async () => {
			try {
				const res = await fetch("/api/identity/phone-status");
				const data = (await res.json()) as { hasPhone?: boolean };
				if (data.hasPhone === false) {
					setStatus("gated");
					// PhoneGate is now the authoritative flow for this user — stop any
					// further silent LoginForm-triggered retry attempts for the stale value.
					clearPendingPhone(user.email);
				} else {
					setStatus("hidden");
				}
			} catch {
				// Failure reaching our OWN route (not proton_identity — that failure mode
				// is handled, and already fails open, inside the route itself). Same
				// fail-open bias applies here: never let a broken fetch lock the user out.
				setStatus("hidden");
			}
		})();
	}, [isLoggedIn, user?.id, user?.email]);

	// Focus trap only — deliberately no Escape handler and no backdrop onClick.
	// This overlay must not be dismissible except by completing it or signing out.
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key !== "Tab") return;
		const panel = panelRef.current;
		if (!panel) return;
		const focusable = Array.from(
			panel.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			),
		).filter((el) => !el.hasAttribute("disabled"));
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last?.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first?.focus();
		}
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			const validation = validatePhoneFields(values);
			if (validation) {
				setFieldError(validation === "required" ? tField("required") : tField("invalid"));
				return;
			}
			setFieldError(undefined);
			setOutcome(null);
			setSubmitting(true);

			try {
				const res = await fetch("/api/identity/set-phone", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ phone: combinePhone(values) }),
				});
				const data = (await res.json().catch(() => null)) as { outcome?: string } | null;

				if (res.ok && data?.outcome === "success") {
					setStatus("hidden");
					setServiceErrorCount(0);
					return;
				}
				if (data?.outcome === "invalid") {
					setOutcome("invalid");
				} else if (data?.outcome === "conflict") {
					setOutcome("conflict");
				} else {
					setOutcome("service_error");
					setServiceErrorCount((count) => count + 1);
				}
			} catch {
				setOutcome("service_error");
				setServiceErrorCount((count) => count + 1);
			} finally {
				setSubmitting(false);
			}
		},
		[values, tField],
	);

	if (status !== "gated") return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="phone-gate-title"
			onKeyDown={handleKeyDown}
		>
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

			<div
				ref={panelRef}
				tabIndex={-1}
				className="relative z-10 w-full max-w-md rounded-2xl bg-surface-base p-6 shadow-xl focus:outline-none"
			>
				<h2 id="phone-gate-title" className="text-lg font-semibold text-content-primary">
					{t("title")}
				</h2>
				<p className="mt-1 text-sm text-content-secondary">{t("subtitle")}</p>

				<form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
					<PhoneField
						id="phone-gate-number"
						values={values}
						onChange={setValues}
						error={fieldError}
						required
					/>

					{outcome === "invalid" && (
						<p role="alert" className="text-sm text-red-600">
							{t("errors.invalid")}
						</p>
					)}
					{outcome === "conflict" && (
						<p role="alert" className="text-sm text-red-600">
							{t("errors.conflict")}
						</p>
					)}
					{outcome === "service_error" && (
						<p role="alert" className="text-sm text-status-warning">
							{t("errors.serviceError")}
						</p>
					)}

					<Button type="submit" variant="primary" size="md" loading={submitting} className="w-full">
						{t("submit")}
					</Button>

					{serviceErrorCount >= SERVICE_ERROR_DISMISS_THRESHOLD && (
						<button
							type="button"
							onClick={() => setStatus("hidden")}
							className="text-center text-sm text-content-secondary underline-offset-2 hover:underline"
						>
							{t("continueAnyway")}
						</button>
					)}

					<button
						type="button"
						onClick={() => void logout()}
						className="text-center text-xs text-content-secondary underline-offset-2 hover:underline"
					>
						{t("signOutInstead")}
					</button>
				</form>
			</div>
		</div>
	);
}
