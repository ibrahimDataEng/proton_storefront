"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export default function MainError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const t = useTranslations("error");

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
			{/* Animated warning triangle */}
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 120 120"
				className="mb-8 h-28 w-28 text-status-warning"
				aria-hidden="true"
				initial={{ opacity: 0, rotate: -10 }}
				animate={{ opacity: 1, rotate: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				<motion.path
					d="M60 15 L105 95 L15 95 Z"
					fill="currentColor"
					opacity={0.12}
					initial={{ scale: 0.5 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				/>
				<motion.path
					d="M60 20 L101 92 L19 92 Z"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinejoin="round"
					opacity={0.6}
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.6, delay: 0.2 }}
				/>
				<motion.rect
					x="57"
					y="48"
					width="6"
					height="24"
					rx="3"
					fill="currentColor"
					opacity={0.7}
					initial={{ scaleY: 0 }}
					animate={{ scaleY: 1 }}
					style={{ transformOrigin: "60px 48px" }}
					transition={{ delay: 0.6, duration: 0.3 }}
				/>
				<motion.circle
					cx="60"
					cy="80"
					r="3.5"
					fill="currentColor"
					opacity={0.7}
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.8, duration: 0.25, type: "spring" }}
				/>
			</motion.svg>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.35, duration: 0.4 }}
				className="flex max-w-md flex-col items-center gap-3"
			>
				<h1 className="text-2xl font-semibold text-content-primary">{t("title")}</h1>
				<p className="text-content-secondary">{t("description")}</p>
				{error.digest && (
					<code className="mt-1 rounded-md bg-surface-sunken px-3 py-2 text-xs text-content-secondary">
						{t("code")}: {error.digest}
					</code>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.55, duration: 0.3 }}
				className="mt-8 flex flex-wrap justify-center gap-3"
			>
				<motion.button
					whileTap={{ scale: 0.97 }}
					type="button"
					onClick={reset}
					className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
				>
					{t("tryAgain")}
				</motion.button>
				<LinkWithChannel
					href="/"
					className="inline-flex h-11 items-center justify-center rounded-lg border border-line-default px-6 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
				>
					{t("goHome")}
				</LinkWithChannel>
			</motion.div>
		</div>
	);
}
