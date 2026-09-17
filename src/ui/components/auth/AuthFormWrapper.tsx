"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

// Slide direction is logical (start/end), not physical left/right, so it
// mirrors correctly under RTL — the sign flips based on locale rather than
// assuming LTR. Same duration/easing as the checkout wizard's step transition
// (CheckoutForm.tsx's slideVariants) so switching tabs here reads as the same
// kind of motion as advancing/going back there.
const getSlideVariants = (isRtl: boolean) => {
	const sign = isRtl ? -1 : 1;
	return {
		initial: (dir: 1 | -1) => ({ opacity: 0, x: dir * sign * 16 }),
		animate: { opacity: 1, x: 0 },
		exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * sign * -16 }),
	};
};

type AuthView = "login" | "register" | "forgot" | "confirmation";

type Props = {
	mode: "login" | "register";
	onModeChange?: (mode: "login" | "register") => void;
};

export function AuthFormWrapper({ mode, onModeChange = () => {} }: Props) {
	const t = useTranslations("auth");
	const locale = useLocale();
	const isRtl = locale === "ar";
	const prefersReducedMotion = useReducedMotion();
	const [view, setView] = useState<AuthView>(mode);

	// Keep view in sync when mode prop changes (modal mode switch)
	const effectiveView: AuthView = view === "forgot" || view === "confirmation" ? view : mode;

	// login -> register slides "forward" (+1), register -> login slides "back"
	// (-1) — a fixed tab order, not a history stack, so this only needs the
	// previous mode, not a full direction state machine like the checkout
	// wizard's goNext/goBack.
	const previousMode = useRef(mode);
	const direction: 1 | -1 = mode === "register" && previousMode.current === "login" ? 1 : -1;
	previousMode.current = mode;

	const slideVariants = getSlideVariants(isRtl);

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
			<div role="tablist" className="flex rounded-xl border border-line-default bg-surface-sunken p-1">
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
							"flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
							mode === key
								? "bg-brand-primary text-content-inverse shadow-sm"
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

			{/* `layout` on the outer div lets framer-motion smoothly resize the
			    container to whichever panel is mounted (no pixel height guess —
			    measured from real layout, so it holds for the longest Arabic
			    copy and for an error banner appearing inside either form).
			    `mode="popLayout"` pops the exiting panel out of flow immediately
			    so the container's layout animation targets only the incoming
			    panel's height, instead of measuring both stacked. Reduced-motion:
			    keep the crossfade but drop the slide and shrink the duration. */}
			<motion.div layout transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, ease: "easeInOut" }}>
				<AnimatePresence mode="popLayout" initial={false} custom={direction}>
					<motion.div
						key={mode}
						custom={direction}
						variants={prefersReducedMotion ? undefined : slideVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: prefersReducedMotion ? 0.1 : 0.22, ease: "easeInOut" }}
					>
						{mode === "login" ? (
							<LoginForm onForgotPassword={() => setView("forgot")} />
						) : (
							<RegisterForm onConfirmationRequired={() => setView("confirmation")} />
						)}
					</motion.div>
				</AnimatePresence>
			</motion.div>

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
