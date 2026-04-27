"use client";

import { useState } from "react";

interface PromoCodeFieldProps {
	placeholder: string;
	applyLabel: string;
}

// TODO: Wire to Saleor checkoutAddPromoCode mutation once the GraphQL operation is added
// to src/graphql/. The mutation does not exist in the current schema snapshot.
// When adding: create CheckoutAddPromoCode.graphql, run codegen, add applyPromoCode
// server action to actions.ts, and accept checkoutId + handle success/error states here.
export function PromoCodeField({ placeholder, applyLabel }: PromoCodeFieldProps) {
	const [code, setCode] = useState("");

	return (
		<div className="space-y-1.5">
			<div className="flex gap-2">
				<input
					type="text"
					value={code}
					onChange={(e) => setCode(e.target.value)}
					placeholder={placeholder}
					disabled
					className="flex-1 cursor-not-allowed rounded-md border border-line-default bg-surface-sunken px-3 py-2 text-sm text-content-secondary placeholder:text-content-secondary focus:outline-none"
				/>
				<button
					type="button"
					disabled
					title={applyLabel}
					className="cursor-not-allowed rounded-md bg-surface-sunken px-4 py-2 text-sm font-medium text-content-secondary opacity-50"
				>
					{applyLabel}
				</button>
			</div>
			<p className="text-xs text-content-secondary">Promo codes coming soon</p>
		</div>
	);
}
