interface CheckoutFooterProps {
	locale: string;
}

export const CheckoutFooter = ({ locale }: CheckoutFooterProps) => {
	const isAr = locale === "ar";
	const currentYear = new Date().getFullYear();

	return (
		<footer className="w-full border-t border-white/10 bg-surface-footer px-4 py-6">
			{/* Payment methods label */}
			<p className="mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-neutral-500">
				{isAr ? "وسائل الدفع المقبولة" : "Accepted Payment Methods"}
			</p>

			{/* Icons row */}
			<div className="flex flex-wrap items-center justify-center gap-2">
				{/* VISA */}
				<div className="flex h-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3">
					<span className="text-[13px] font-bold tracking-wider text-white">VISA</span>
				</div>

				{/* Mastercard */}
				<div className="flex h-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-2">
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
				<div className="flex h-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3">
					<span className="text-[12px] font-medium text-[#9fcfb8]">
						{isAr ? "💵 الدفع عند الاستلام" : "💵 Cash on Delivery"}
					</span>
				</div>
			</div>

			{/* Copyright */}
			<p className="mb-3 mt-4 text-center text-[11px] text-neutral-500">
				{isAr
					? `جميع الحقوق محفوظة © ${currentYear} PROTON`
					: `© ${currentYear} PROTON. All rights reserved.`}
			</p>

			{/* SSL note */}
			<div className="flex items-center justify-center gap-1.5">
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
				<span className="text-[11px] text-neutral-500">
					{isAr ? "جميع المعاملات مشفرة ومحمية بـ SSL 256-bit" : "All transactions are SSL 256-bit encrypted"}
				</span>
			</div>
		</footer>
	);
};
