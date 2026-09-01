"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type State = "pending" | "success" | "error";

export function ConfirmAccountClient() {
	const t = useTranslations("confirmAccount");
	const searchParams = useSearchParams();
	const email = searchParams.get("email") ?? "";
	const token = searchParams.get("token") ?? "";

	const [state, setState] = useState<State>(email && token ? "pending" : "error");
	const ranRef = useRef(false);

	useEffect(() => {
		if (!email || !token || ranRef.current) return;
		ranRef.current = true;

		void (async () => {
			try {
				const res = await fetch("/api/auth/confirm-account", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, token }),
				});
				const data = (await res.json()) as { success?: boolean; error?: string };
				setState(res.ok && data.success ? "success" : "error");
			} catch {
				setState("error");
			}
		})();
	}, [email, token]);

	if (state === "pending") {
		return (
			<m.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center gap-4 py-4 text-center"
			>
				<Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-hidden="true" />
				<p className="text-sm text-content-secondary">{t("pending")}</p>
			</m.div>
		);
	}

	if (state === "success") {
		return (
			<m.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="flex flex-col items-center gap-4 py-4 text-center"
			>
				<CheckCircle2 className="h-12 w-12 text-status-success" aria-hidden="true" />
				<m.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.3 }}
					className="flex flex-col items-center gap-2"
				>
					<h1 className="text-lg font-semibold text-content-primary">{t("successTitle")}</h1>
					<p className="max-w-sm text-sm text-content-secondary">{t("successSubtitle")}</p>
				</m.div>
				<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}>
					<LinkWithChannel
						href="/login"
						className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
					>
						{t("loginButton")}
					</LinkWithChannel>
				</m.div>
			</m.div>
		);
	}

	// error state — also covers a missing/malformed email or token in the URL
	return (
		<m.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="flex flex-col items-center gap-4 py-4 text-center"
		>
			<XCircle className="h-12 w-12 text-status-danger" aria-hidden="true" />
			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, duration: 0.3 }}
				className="flex flex-col items-center gap-2"
			>
				<h1 className="text-lg font-semibold text-content-primary">{t("errorTitle")}</h1>
				<p className="max-w-sm text-sm text-content-secondary">{t("errorSubtitle")}</p>
			</m.div>
			<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}>
				<LinkWithChannel
					href="/login"
					className="inline-flex h-11 items-center justify-center rounded-lg border border-line-default px-6 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
				>
					{t("loginButton")}
				</LinkWithChannel>
			</m.div>
		</m.div>
	);
}
