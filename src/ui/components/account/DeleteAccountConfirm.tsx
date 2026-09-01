"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
import { confirmAccountDeletion } from "@/app/[locale]/[channel]/(main)/account/actions";
import { useAuth } from "@/ui/context/AuthContext";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type State = "processing" | "success" | "expired" | "notAuthenticated" | "missingToken";

export function DeleteAccountConfirm() {
	const t = useTranslations("accountDeletion");
	const tAuth = useTranslations("auth");
	const searchParams = useSearchParams();
	const { logout } = useAuth();
	const token = searchParams.get("token") ?? "";

	const [state, setState] = useState<State>(token ? "processing" : "missingToken");
	const ranRef = useRef(false);

	useEffect(() => {
		if (!token || ranRef.current) return;
		ranRef.current = true;

		void (async () => {
			const result = await confirmAccountDeletion(token);
			if (result.ok) {
				setState("success");
				setTimeout(() => {
					void logout();
				}, 2000);
				return;
			}
			setState(result.error === "NOT_AUTHENTICATED" ? "notAuthenticated" : "expired");
		})();
	}, [token, logout]);

	if (state === "missingToken") {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<XCircle className="h-10 w-10 text-status-danger" aria-hidden="true" />
				<p role="alert" className="text-sm text-content-primary">
					{t("missingToken")}
				</p>
				<LinkWithChannel href="/" className="text-sm text-brand-primary underline-offset-2 hover:underline">
					{t("backHome")}
				</LinkWithChannel>
			</div>
		);
	}

	if (state === "processing") {
		return <p className="text-center text-sm text-content-secondary">{t("processing")}</p>;
	}

	if (state === "success") {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<CheckCircle2 className="h-10 w-10 text-status-success" aria-hidden="true" />
				<h1 className="text-lg font-semibold text-content-primary">{t("successTitle")}</h1>
				<p className="text-sm text-content-secondary">{t("successBody")}</p>
			</div>
		);
	}

	if (state === "notAuthenticated") {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<XCircle className="h-10 w-10 text-status-danger" aria-hidden="true" />
				<p role="alert" className="text-sm text-content-primary">
					{t("notAuthenticated")}
				</p>
				<LinkWithChannel
					href="/login"
					className="text-sm text-brand-primary underline-offset-2 hover:underline"
				>
					{tAuth("login")}
				</LinkWithChannel>
			</div>
		);
	}

	// expired / invalid token
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<XCircle className="h-10 w-10 text-status-danger" aria-hidden="true" />
			<p role="alert" className="text-sm text-content-primary">
				{t("invalidOrExpired")}
			</p>
			<LinkWithChannel href="/" className="text-sm text-brand-primary underline-offset-2 hover:underline">
				{t("backHome")}
			</LinkWithChannel>
		</div>
	);
}
