"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

/** Returns the next 17:00 UAE time (UTC+4 = 13:00 UTC) as a UTC Date. */
function getNextCutoffUTC(): Date {
	const now = new Date();
	// Today's 17:00 UAE = 13:00 UTC
	const todayCutoff = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 0, 0, 0),
	);
	if (now < todayCutoff) return todayCutoff;
	// Already past today's cutoff — use tomorrow
	const tomorrowCutoff = new Date(todayCutoff);
	tomorrowCutoff.setUTCDate(tomorrowCutoff.getUTCDate() + 1);
	return tomorrowCutoff;
}

function getRemainingSeconds(): number {
	return Math.max(0, Math.floor((getNextCutoffUTC().getTime() - Date.now()) / 1000));
}

interface TimeUnit {
	value: string;
	label: string;
}

function Unit({ value, label }: TimeUnit) {
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
	const [remaining, setRemaining] = useState(0);

	useEffect(() => {
		setMounted(true);
		setRemaining(getRemainingSeconds());
		const id = setInterval(() => {
			const secs = getRemainingSeconds();
			setRemaining(secs);
		}, 1000);
		return () => clearInterval(id);
	}, []);

	// Return null on server / before hydration / when countdown expires
	if (!mounted || remaining === 0) return null;

	const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
	const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
	const s = String(remaining % 60).padStart(2, "0");

	const labels = locale === "ar" ? { h: "س", m: "د", s: "ث" } : { h: "hrs", m: "min", s: "sec" };

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
					{locale === "ar" ? (
						<>
							اطلب الآن وسيصلك <span className="font-semibold text-[#c9e8d8]">غداً</span> إذا أكملت طلبك خلال
						</>
					) : (
						<>
							Order now and get it <span className="font-semibold text-[#c9e8d8]">tomorrow</span> if you
							complete within
						</>
					)}
				</span>

				{/* Timer */}
				<div className="inline-flex items-center gap-1 rounded-md bg-[#2d6a4f] px-3 py-0.5">
					<Unit value={h} label={labels.h} />
					<span className="text-base font-bold text-[#9fcfb8]">:</span>
					<Unit value={m} label={labels.m} />
					<span className="text-base font-bold text-[#9fcfb8]">:</span>
					<Unit value={s} label={labels.s} />
				</div>

				{/* Abbreviated text — shown only on very small screens */}
				<span className="text-xs text-white sm:hidden">
					{locale === "ar" ? "للتوصيل غداً" : "for tomorrow"}
				</span>
			</div>
		</div>
	);
};
