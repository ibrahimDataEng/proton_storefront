"use client";

import { useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: HTMLElement,
				options: {
					sitekey: string;
					callback: (token: string) => void;
					"expired-callback"?: () => void;
					"error-callback"?: () => void;
					theme?: "light" | "dark";
				},
			) => string;
			reset: (widgetId?: string) => void;
			remove: (widgetId?: string) => void;
		};
	}
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SCRIPT_ID = "cf-turnstile-script";

interface TurnstileWidgetProps {
	onVerify: (token: string) => void;
	onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const [scriptReady, setScriptReady] = useState(false);

	useEffect(() => {
		if (window.turnstile) {
			setScriptReady(true);
			return;
		}

		const existing = document.getElementById(SCRIPT_ID);
		if (existing) {
			existing.addEventListener("load", () => setScriptReady(true));
			return;
		}

		const script = document.createElement("script");
		script.id = SCRIPT_ID;
		script.src = SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => setScriptReady(true);
		document.body.appendChild(script);
	}, []);

	useEffect(() => {
		if (!scriptReady || !containerRef.current || !window.turnstile) return;

		const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
		if (!siteKey) {
			console.error("[TurnstileWidget] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
			return;
		}

		widgetIdRef.current = window.turnstile.render(containerRef.current, {
			sitekey: siteKey,
			callback: onVerify,
			"expired-callback": onExpire,
		});

		return () => {
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scriptReady]);

	return <div ref={containerRef} />;
}
