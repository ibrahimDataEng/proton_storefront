interface CheckoutFooterProps {
	locale: string;
}

export const CheckoutFooter = ({ locale }: CheckoutFooterProps) => {
	const isAr = locale === "ar";

	return (
		<footer className="w-full border-t border-neutral-100 bg-white px-4 py-6">
			{/* ROW 1 — Payment methods */}
			<p className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-neutral-400">
				{isAr ? "وسائل الدفع المقبولة" : "Accepted Payment Methods"}
			</p>

			<div className="flex flex-wrap items-center justify-center gap-2">
				{/* VISA */}
				<div className="flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-3">
					<span className="text-[13px] font-bold tracking-wider text-[#1a1f71]">VISA</span>
				</div>

				{/* Mastercard */}
				<div className="flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2">
					<svg
						width="38"
						height="24"
						viewBox="0 0 38 24"
						xmlns="http://www.w3.org/2000/svg"
						aria-label="Mastercard"
						role="img"
					>
						<circle cx="14" cy="12" r="10" fill="#EB001B" />
						<circle cx="24" cy="12" r="10" fill="#F79E1B" />
						<path d="M19 4.8a10 10 0 0 1 0 14.4A10 10 0 0 1 19 4.8z" fill="#FF5F00" />
					</svg>
				</div>

				{/* Cash on Delivery */}
				<div className="flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-[#f0f7f4] px-3">
					<span className="text-[12px] font-medium text-[#2d6a4f]">
						{isAr ? "💵 الدفع عند الاستلام" : "💵 Cash on Delivery"}
					</span>
				</div>
			</div>

			{/* ROW 2 — SSL note */}
			<div className="mt-4 flex items-center justify-center gap-1.5">
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="#9ca3af"
					strokeWidth={2}
					aria-hidden="true"
				>
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
					<path d="M7 11V7a5 5 0 0 1 10 0v4" />
				</svg>
				<span className="text-[11px] text-neutral-400">
					{isAr ? "جميع المعاملات مشفرة ومحمية بـ SSL 256-bit" : "All transactions are SSL 256-bit encrypted"}
				</span>
			</div>
		</footer>
	);
};
