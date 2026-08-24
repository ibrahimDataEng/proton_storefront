"use client";

import { type ReactNode } from "react";
import { m } from "framer-motion";

interface EmptyStateProps {
	icon: ReactNode;
	title: string;
	subtitle: string;
	action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
	return (
		<m.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4 }}
			className="flex flex-col items-center justify-center gap-4 py-16 text-center"
		>
			<m.div
				animate={{ y: [0, -8, 0] }}
				transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
				className="text-content-secondary"
			>
				{icon}
			</m.div>
			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2, duration: 0.3 }}
				className="flex flex-col items-center gap-2"
			>
				<h2 className="text-xl font-semibold text-content-primary">{title}</h2>
				<p className="max-w-sm text-content-secondary">{subtitle}</p>
			</m.div>
			{action && (
				<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
					{action}
				</m.div>
			)}
		</m.div>
	);
}
