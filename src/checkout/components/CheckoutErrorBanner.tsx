"use client";
import { useEffect, useState } from "react";

interface CheckoutErrorBannerProps {
	message: string | null;
	onDismiss: () => void;
}

export const CheckoutErrorBanner = ({ message, onDismiss }: CheckoutErrorBannerProps) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (message) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [message]);

	if (!message) return null;

	return (
		<div
			className={`mb-4 rounded-md border border-red-200 bg-red-50 p-3 transition-opacity duration-300 ${
				visible ? "opacity-100" : "opacity-0"
			}`}
			role="alert"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2">
					<svg
						className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div>
						<p className="text-sm font-medium text-red-700">{message}</p>
						<a
							href="https://wa.me/971558711442"
							target="_blank"
							rel="noopener noreferrer"
							className="mt-0.5 block text-xs text-red-500 underline hover:text-red-700"
						>
							Need help? Contact us on WhatsApp
						</a>
					</div>
				</div>
				<button
					onClick={onDismiss}
					className="flex-shrink-0 text-red-400 hover:text-red-600"
					aria-label="Dismiss error"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	);
};
