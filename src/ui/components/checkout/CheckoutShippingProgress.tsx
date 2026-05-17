interface CheckoutShippingProgressProps {
	subtotal: number;
	threshold?: number;
	locale: string;
}

export const CheckoutShippingProgress = ({
	subtotal,
	threshold = 200,
	locale,
}: CheckoutShippingProgressProps) => {
	const pct = Math.min((subtotal / threshold) * 100, 100);
	const remaining = Math.max(threshold - subtotal, 0);
	const isFree = subtotal >= threshold;

	return (
		<div className="rounded-xl border border-[#d4e8de] bg-[#f0f7f4] px-4 py-3">
			{/* Status row */}
			<div className="flex items-center justify-between gap-2">
				<span className="text-base">🚚</span>
				<p className={isFree ? "flex-1 text-sm font-medium text-[#1a3c2a]" : "flex-1 text-sm text-[#5c5c5c]"}>
					{isFree
						? locale === "ar"
							? "🎉 أحسنت! حصلت على توصيل مجاني"
							: "🎉 Free shipping unlocked on your order!"
						: locale === "ar"
							? `أضف د.إ ${Math.ceil(remaining)} للحصول على توصيل مجاني (للطلبات فوق 200 درهم)`
							: `Add د.إ ${Math.ceil(remaining)} more for free shipping (orders over د.إ 200)`}
				</p>
				{isFree && (
					<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#2d6a4f]">
						<svg
							className="h-3 w-3 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={3}
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</span>
				)}
			</div>

			{/* Progress bar */}
			<div className="mt-2 h-1.5 w-full rounded-full bg-[#d4e8de]">
				<div
					className="h-full rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#52b788] transition-all duration-500"
					style={{ width: `${pct}%` }}
					role="progressbar"
					aria-valuenow={Math.round(pct)}
					aria-valuemin={0}
					aria-valuemax={100}
				/>
			</div>

			{/* Scale labels */}
			<div className="mt-1 flex justify-between text-[10px] text-[#8a8a8a]">
				<span>د.إ 0</span>
				<span className="font-medium text-[#2d6a4f]">
					{locale === "ar" ? `د.إ ${threshold} — مجاني` : `د.إ ${threshold} — Free`}
				</span>
			</div>
		</div>
	);
};
