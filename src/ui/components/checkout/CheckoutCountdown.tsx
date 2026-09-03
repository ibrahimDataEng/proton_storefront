"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

type DeliveryLabel = "tomorrow" | "dayAfterTomorrow";

interface DeliveryInfo {
	label: DeliveryLabel;
	targetMs: number;
}

/**
 * UAE time = UTC+4 (no DST).
 * Delivery cutoff: 08:00–20:00 UAE → next-day delivery; 20:00–08:00 UAE →
 * delivery in 2 days (Session 39).
 * Window 08:00–19:59 UAE → deliver TOMORROW  (count to 20:00 UAE = 16:00 UTC)
 * Window 20:00–07:59 UAE → deliver DAY AFTER (count to next 08:00 UAE = 04:00 UTC)
 */
function getDeliveryInfo(): DeliveryInfo {
	const now = new Date();
	const uaeHour = (now.getUTCHours() + 4) % 24;

	if (uaeHour >= 8 && uaeHour < 20) {
		// Inside same-day window → count down to 20:00 UAE (16:00 UTC)
		const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16, 0, 0, 0));
		if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
		return { label: "tomorrow", targetMs: target.getTime() };
	} else {
		// Outside window → count down to next 08:00 UAE (04:00 UTC)
		const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 0, 0, 0));
		if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
		return { label: "dayAfterTomorrow", targetMs: target.getTime() };
	}
}

interface TimeDisplay {
	h: string;
	m: string;
	s: string;
}

function Unit({ value, label }: { value: string; label: string }) {
	return (
		<span className="flex flex-col items-center">
			<span className="text-base font-bold tabular-nums text-white">{value}</span>
			<span className="text-[9px] text-[#9fcfb8]">{label}</span>
		</span>
	);
}

export const CheckoutCountdown = () => {
	const locale = useLocale();
	// mounted flag prevents hydration mismatch — timer only starts client-side
	const [mounted, setMounted] = useState(false);
	const [timeLeft, setTimeLeft] = useState<TimeDisplay>({ h: "00", m: "00", s: "00" });
	const [deliveryLabel, setDeliveryLabel] = useState<DeliveryLabel>("tomorrow");

	useEffect(() => {
		setMounted(true);

		function tick() {
			const { label, targetMs } = getDeliveryInfo();
			setDeliveryLabel(label);
			const diff = Math.max(0, targetMs - Date.now());
			const h = Math.floor(diff / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			setTimeLeft({
				h: String(h).padStart(2, "0"),
				m: String(m).padStart(2, "0"),
				s: String(s).padStart(2, "0"),
			});
		}

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);

	// Return null on server / before hydration
	if (!mounted) return null;

	const isAr = locale === "ar";
	const labels = isAr ? { h: "س", m: "د", s: "ث" } : { h: "hrs", m: "min", s: "sec" };

	return (
		<div className="w-full bg-[#1a3c2a] px-4 py-2.5">
			<div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
				{/* Truck icon */}
				<svg
					className="h-4 w-4 flex-shrink-0 text-white"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={1.8}
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
					/>
				</svg>

				{/* Long text — hidden on small phones */}
				<span className="hidden text-sm text-white sm:inline">
					{isAr ? (
						<>
							اطلب الآن وسيصلك{" "}
							<span className="font-semibold text-[#c9e8d8]">
								{deliveryLabel === "tomorrow" ? "غداً" : "بعد غد"}
							</span>{" "}
							إذا أكملت خلال
						</>
					) : (
						<>
							Order now for{" "}
							<span className="font-semibold text-[#c9e8d8]">
								{deliveryLabel === "tomorrow" ? "tomorrow's" : "day-after-tomorrow's"}
							</span>{" "}
							delivery if you complete within
						</>
					)}
				</span>

				{/* Timer pill */}
				<div className="inline-flex items-center gap-1 rounded-md bg-[#2d6a4f] px-3 py-0.5">
					<Unit value={timeLeft.h} label={labels.h} />
					<span className="text-base font-bold text-[#9fcfb8]">:</span>
					<Unit value={timeLeft.m} label={labels.m} />
					<span className="text-base font-bold text-[#9fcfb8]">:</span>
					<Unit value={timeLeft.s} label={labels.s} />
				</div>

				{/* Abbreviated text — shown only on very small screens */}
				<span className="text-xs text-white sm:hidden">
					{isAr
						? deliveryLabel === "tomorrow"
							? "للتوصيل غداً"
							: "للتوصيل بعد غد"
						: deliveryLabel === "tomorrow"
							? "for tomorrow"
							: "for day after tomorrow"}
				</span>
			</div>
		</div>
	);
};
