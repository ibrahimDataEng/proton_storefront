"use client";

import { useState } from "react";

interface PromoCodeFieldProps {
	placeholder: string;
	applyLabel: string;
}

// TODO: wire to Saleor checkoutAddPromoCode mutation in future session
export function PromoCodeField({ placeholder, applyLabel }: PromoCodeFieldProps) {
	const [code, setCode] = useState("");

	return (
		<div className="flex gap-2">
			<input
				type="text"
				value={code}
				onChange={(e) => setCode(e.target.value)}
				placeholder={placeholder}
				className="flex-1 rounded-md border border-line-default bg-surface-sunken px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
			/>
			<button
				type="button"
				disabled={!code.trim()}
				className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{applyLabel}
			</button>
		</div>
	);
}
