"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PHONE_SAVE_NOTICE_EVENT } from "@/lib/auth/phoneSaveNotice";

/**
 * Non-blocking heads-up for the one failure mode Part A's silent post-registration
 * phone write can hit (see RegisterForm.tsx): registration and login already
 * succeeded, so this is purely informational — PhoneGate (the login-gate) is what
 * actually guarantees the phone eventually gets collected, on this or a future
 * login. Listens for a window event rather than reading AuthContext state — see
 * phoneSaveNotice.ts for why a context flag doesn't survive this specific race.
 */
export function PhoneSaveNoticeBanner() {
	const t = useTranslations("phoneGate");
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const handler = () => setVisible(true);
		window.addEventListener(PHONE_SAVE_NOTICE_EVENT, handler);
		return () => window.removeEventListener(PHONE_SAVE_NOTICE_EVENT, handler);
	}, []);

	if (!visible) return null;

	return (
		<div
			role="status"
			className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md items-start gap-2 rounded-lg bg-status-warning/10 px-4 py-3 text-sm text-content-primary shadow-lg ring-1 ring-status-warning/30 md:bottom-4"
		>
			<p className="flex-1">{t("saveNotice")}</p>
			<button
				type="button"
				onClick={() => setVisible(false)}
				aria-label={t("dismiss")}
				className="shrink-0 text-content-secondary hover:text-content-primary"
			>
				<X className="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	);
}
