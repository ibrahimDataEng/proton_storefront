"use client";

import { useEffect, useRef, useCallback } from "react";
import { AuthFormWrapper } from "./AuthFormWrapper";
import { useAuth } from "@/ui/context/AuthContext";

export function AuthModal() {
	const { isAuthModalOpen, authModalMode, setAuthModalMode, closeAuthModal } = useAuth();
	const panelRef = useRef<HTMLDivElement>(null);

	// Body scroll lock
	useEffect(() => {
		if (!isAuthModalOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isAuthModalOpen]);

	// Focus panel on open so Escape / Tab trap work immediately
	useEffect(() => {
		if (isAuthModalOpen) {
			panelRef.current?.focus();
		}
	}, [isAuthModalOpen]);

	// Focus trap + Escape
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

			{/* Panel — tabIndex={-1} lets us programmatically focus it on open */}
			<div
				ref={panelRef}
				tabIndex={-1}
				className="relative z-10 w-full max-w-md rounded-2xl bg-surface-base p-6 shadow-xl focus:outline-none"
			>
				<AuthFormWrapper mode={authModalMode} onModeChange={setAuthModalMode} />
			</div>
		</div>
	);
}
