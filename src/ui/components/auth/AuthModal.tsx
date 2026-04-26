"use client";

import { useEffect, useRef, useCallback } from "react";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthFormWrapper } from "./AuthFormWrapper";
import { useAuth } from "@/ui/context/AuthContext";

export function AuthModal() {
	const t = useTranslations("auth");
	const { isAuthModalOpen, authModalMode, setAuthModalMode, closeAuthModal } = useAuth();
	const panelRef = useRef<HTMLDivElement>(null);
	const firstFocusableRef = useRef<HTMLButtonElement>(null);

	// Body scroll lock
	useEffect(() => {
		if (!isAuthModalOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isAuthModalOpen]);

	// Focus panel on open
	useEffect(() => {
		if (isAuthModalOpen) {
			firstFocusableRef.current?.focus();
		}
	}, [isAuthModalOpen]);

	// Focus trap
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				closeAuthModal();
				return;
			}
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
		},
		[closeAuthModal],
	);

	if (!isAuthModalOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="auth-modal-title"
			onKeyDown={handleKeyDown}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-hidden="true"
				onClick={closeAuthModal}
			/>

			{/* Panel */}
			<div ref={panelRef} className="relative z-10 w-full max-w-md rounded-2xl bg-surface-base p-6 shadow-xl">
				<button
					ref={firstFocusableRef}
					type="button"
					onClick={closeAuthModal}
					className="absolute end-4 top-4 rounded-md p-1 text-content-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
					aria-label={t("backToLogin")}
				>
					<XIcon className="h-5 w-5" aria-hidden="true" />
				</button>

				<AuthFormWrapper mode={authModalMode} onModeChange={setAuthModalMode} />
			</div>
		</div>
	);
}
