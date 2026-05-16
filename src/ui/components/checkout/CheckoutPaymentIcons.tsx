interface CheckoutPaymentIconsProps {
	locale: string;
}

/** Mastercard logo — two overlapping circles with clipped orange intersection */
const MastercardIcon = () => (
	<svg
		width="36"
		height="22"
		viewBox="0 0 36 22"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Mastercard"
		role="img"
	>
		<defs>
			<clipPath id="mc-clip-l">
				<circle cx="13" cy="11" r="9" />
			</clipPath>
			<clipPath id="mc-clip-r">
				<circle cx="23" cy="11" r="9" />
			</clipPath>
		</defs>
		{/* Red circle */}
		<circle cx="13" cy="11" r="9" fill="#EB001B" />
		{/* Yellow circle */}
		<circle cx="23" cy="11" r="9" fill="#F79E1B" />
		{/* Orange overlap — rect clipped to intersection of both circles */}
		<g clipPath="url(#mc-clip-l)">
			<g clipPath="url(#mc-clip-r)">
				<rect x="0" y="0" width="36" height="22" fill="#FF5F00" />
			</g>
		</g>
	</svg>
);

/** Small lock SVG for SSL note */
const LockIcon = () => (
	<svg
		width="11"
		height="11"
		viewBox="0 0 24 24"
		fill="none"
		stroke="#8a8a8a"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>
);

export const CheckoutPaymentIcons = ({ locale }: CheckoutPaymentIconsProps) => {
	const isAr = locale === "ar";

	return (
		<div className="rounded-xl border border-[#e8ddd0] bg-white px-4 py-3">
			{/* Title */}
			<p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[#8a8a8a]">
				{isAr ? "وسائل الدفع المقبولة" : "Accepted Payment Methods"}
			</p>

			{/* Payment method icons */}
			<div className="flex flex-wrap items-center gap-2">
				{/* VISA */}
				<div className="flex h-7 items-center justify-center rounded border border-[#e8ddd0] bg-white px-3">
					<span className="text-xs font-bold text-[#1a1f71]">VISA</span>
				</div>

				{/* Mastercard */}
				<div className="flex h-7 items-center justify-center rounded border border-[#e8ddd0] bg-white px-1.5">
					<MastercardIcon />
				</div>

				{/* Apple Pay */}
				<div className="flex h-7 items-center justify-center rounded border border-[#e8ddd0] bg-white px-3">
					<span className="text-[11px] font-bold text-black">🍎 Pay</span>
				</div>

				{/* AMEX */}
				<div className="flex h-7 items-center justify-center rounded border border-[#e8ddd0] bg-white px-3">
					<span className="text-[10px] font-bold text-[#007bc1]">AMEX</span>
				</div>

				{/* Cash on Delivery */}
				<div className="flex h-7 items-center justify-center rounded border border-[#d4e8de] bg-[#f0f7f4] px-3">
					<span className="text-[10px] font-medium text-[#2d6a4f]">
						{isAr ? "💵 كاش عند التسليم" : "💵 Cash on Delivery"}
					</span>
				</div>
			</div>

			{/* SSL note */}
			<div className="mt-2.5 flex items-center gap-1.5">
				<LockIcon />
				<span className="text-[11px] text-[#8a8a8a]">
					{isAr
						? "مشفر بـ SSL 256-bit — بياناتك آمنة تماماً"
						: "SSL 256-bit encrypted — your data is fully protected"}
				</span>
			</div>
		</div>
	);
};
