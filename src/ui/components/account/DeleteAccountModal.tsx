"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requestAccountDeletion } from "@/app/[locale]/[channel]/(main)/account/actions";

const CONFIRM_WORD = "DELETE";

const REASON_OPTIONS = [
	{ key: "noLongerUse", labelKey: "reasonNoLongerUse" },
	{ key: "haveAnotherAccount", labelKey: "reasonHaveAnotherAccount" },
	{ key: "wantNewAccount", labelKey: "reasonWantNewAccount" },
	{ key: "securityConcerns", labelKey: "reasonSecurityConcerns" },
	{ key: "privacyConcerns", labelKey: "reasonPrivacyConcerns" },
	{ key: "unresolvedIssues", labelKey: "reasonUnresolvedIssues" },
] as const;

interface Props {
	isOpen: boolean;
	onClose: () => void;
	email: string;
}

export function DeleteAccountModal({ isOpen, onClose, email }: Props) {
	const t = useTranslations("accountDeletion");
	const tAuth = useTranslations("auth");
	const tAccount = useTranslations("account");
	const params = useParams<{ locale: string; channel: string }>();
	const panelRef = useRef<HTMLDivElement>(null);

	const [confirmText, setConfirmText] = useState("");
	const [reason, setReason] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

	const canConfirm = confirmText.trim() === CONFIRM_WORD && status !== "sending";

	// Reset local state each time the modal is (re-)opened
	useEffect(() => {
		if (isOpen) {
			setConfirmText("");
			setReason("");
			setStatus("idle");
		}
	}, [isOpen]);

	// Body scroll lock
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	// Focus panel on open so Escape / Tab trap work immediately
	useEffect(() => {
		if (isOpen) {
			panelRef.current?.focus();
		}
	}, [isOpen]);

	const handleClose = useCallback(() => {
		if (status === "sending") return;
		onClose();
	}, [status, onClose]);

	// Focus trap + Escape
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
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
		[handleClose],
	);

	async function handleConfirm() {
		if (!canConfirm) return;
		setStatus("sending");

		// Fire-and-forget: an internal notification, not part of the deletion
		// contract — it must never delay or block the actual request below.
		if (reason) {
			void fetch("/api/account-deletion-feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, reason }),
			}).catch(() => {});
		}

		const redirectUrl =
			typeof window !== "undefined"
				? `${window.location.origin}/${params.locale}/${params.channel}/delete-account`
				: "";
		const channel = params.channel ?? "";

		const result = await requestAccountDeletion({ redirectUrl, channel });
		setStatus(result.ok ? "sent" : "error");
	}

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-account-modal-title"
			onKeyDown={handleKeyDown}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				aria-hidden="true"
				onClick={handleClose}
			/>

			{/* Panel — tabIndex={-1} lets us programmatically focus it on open */}
			<div
				ref={panelRef}
				tabIndex={-1}
				className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-base p-6 shadow-xl focus:outline-none"
			>
				{status === "sent" ? (
					<div className="flex flex-col gap-4 text-center">
						<h2 id="delete-account-modal-title" className="text-lg font-semibold text-content-primary">
							{t("requestSuccessTitle")}
						</h2>
						<p className="text-sm text-content-secondary">{t("requestSuccessBody", { email })}</p>
						<button
							type="button"
							onClick={handleClose}
							className="mx-auto rounded-xl bg-surface-base px-5 py-2.5 text-sm font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
						>
							{t("closeButton")}
						</button>
					</div>
				) : (
					<div className="flex flex-col gap-5">
						<div className="flex items-start gap-3">
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-danger/10">
								<AlertTriangle className="h-5 w-5 text-status-danger" aria-hidden="true" />
							</span>
							<h2 id="delete-account-modal-title" className="pt-2 text-lg font-semibold text-content-primary">
								{t("modalTitle")}
							</h2>
						</div>

						<div className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-4">
							<p className="text-sm font-semibold text-content-primary">{t("whatGetsDeletedTitle")}</p>
							<ul className="list-inside list-disc text-sm text-content-secondary">
								<li>{t("whatGetsDeletedItem1")}</li>
								<li>{t("whatGetsDeletedItem2")}</li>
								<li>{t("whatGetsDeletedItem3")}</li>
							</ul>
						</div>

						<div className="flex flex-col gap-2 rounded-xl bg-status-danger/5 p-4 ring-1 ring-status-danger/20">
							<p className="text-sm font-semibold text-status-danger">{t("whatIsKeptTitle")}</p>
							<p className="text-sm text-content-secondary">{t("whatIsKeptBody")}</p>
						</div>

						{/* Permanence warning — a distinct callout, separate from the retention disclosure above */}
						<div className="flex items-start gap-3 rounded-xl bg-status-warning/10 p-4 ring-1 ring-status-warning/30">
							<AlertTriangle className="h-5 w-5 shrink-0 text-status-warning" aria-hidden="true" />
							<div className="flex flex-col gap-1">
								<p className="text-sm font-semibold text-status-warning">{t("permanenceTitle")}</p>
								<p className="text-sm text-content-secondary">{t("permanenceBody")}</p>
							</div>
						</div>

						{status === "error" && (
							<p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
								{tAuth("errors.unknown")}
							</p>
						)}

						<div className="flex flex-col gap-2">
							<label htmlFor="delete-account-reason" className="text-sm font-medium text-content-primary">
								{t("reasonLabel")}
							</label>
							<select
								id="delete-account-reason"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								disabled={status === "sending"}
								className="w-full rounded-lg border border-line-default bg-surface-base bg-[length:1.25em_1.25em] bg-[right_0.75rem_center] bg-no-repeat py-3 pe-10 ps-4 text-sm text-content-primary outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60 rtl:bg-[left_0.75rem_center]"
							>
								<option value="">{t("reasonPlaceholder")}</option>
								{REASON_OPTIONS.map(({ key, labelKey }) => (
									<option key={key} value={key}>
										{t(labelKey)}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-2">
							<label
								htmlFor="delete-account-confirm-input"
								className="text-sm font-medium text-content-primary"
							>
								{t("confirmInstruction")}
							</label>
							<input
								id="delete-account-confirm-input"
								type="text"
								dir="ltr"
								autoComplete="off"
								autoCorrect="off"
								autoCapitalize="off"
								spellCheck={false}
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								disabled={status === "sending"}
								placeholder={t("confirmPlaceholder")}
								className="w-full rounded-lg border border-line-default bg-surface-base px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary/60 focus:border-status-danger focus:outline-none focus:ring-1 focus:ring-status-danger disabled:opacity-60"
							/>
						</div>

						<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={handleClose}
								disabled={status === "sending"}
								className="rounded-xl bg-surface-base px-5 py-2.5 text-sm font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken disabled:opacity-60"
							>
								{tAccount("cancel")}
							</button>
							<button
								type="button"
								onClick={() => void handleConfirm()}
								disabled={!canConfirm}
								className="rounded-xl bg-status-danger px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-status-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{status === "sending" ? "…" : t("confirmButton")}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
