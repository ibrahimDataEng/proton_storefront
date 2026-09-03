import { Suspense, useEffect } from "react";
import { useLocale } from "next-intl";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { trackPurchase } from "@/lib/analytics/gtag";

export const OrderConfirmation = () => {
	const { orderConfirmation } = useCheckoutMessages();
	const { order } = useOrder();
	const locale = useLocale();

	useEffect(() => {
		// Session 25: clear stale checkout cookie + URL param after order completes
		document.cookie.split(";").forEach((c) => {
			const name = c.split("=")[0].trim();
			if (name.startsWith("checkoutId-")) {
				document.cookie = `${name}=; Max-Age=0; path=/`;
			}
		});
		if (window.location.search.includes("checkout=")) {
			const url = new URL(window.location.href);
			url.searchParams.delete("checkout");
			window.history.replaceState({}, "", url.toString());
		}
	}, []);

	useEffect(() => {
		if (!order?.id) return;
		// OrderLineFragment carries no product/variant id — the order line id
		// stands in as the GA4 item_id (see Session 37 diagnostic)
		const dedupeKey = `ga4_purchase_tracked_${order.id}`;
		try {
			if (sessionStorage.getItem(dedupeKey)) return;
			sessionStorage.setItem(dedupeKey, "1");
		} catch {
			// sessionStorage unavailable (private mode, etc.) — fall through and
			// track once for this mount rather than blocking the event entirely
		}
		trackPurchase({
			transaction_id: order.number ?? order.id,
			value: order.total?.gross?.amount ?? 0,
			items: (order.lines ?? []).map((line) => ({
				item_id: line.id,
				item_name: line.productName,
				price: line.unitPrice?.gross?.amount,
				quantity: line.quantity,
			})),
		});
	}, [order?.id, order?.number, order?.total?.gross?.amount, order?.lines]);

	return (
		<main className="grid grid-cols-1 gap-x-16 lg:grid-cols-2" dir={locale === "ar" ? "rtl" : "ltr"}>
			<div>
				<div className="mb-6 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5ee]">
						<svg className="h-6 w-6 text-[#2d6a4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<p className="text-lg font-bold text-[#1a4a32]" data-testid="orderConfrmationTitle">
							{orderConfirmation.title.replace("{number}", order.number ?? "")}
						</p>
						<p className="text-sm text-neutral-500">
							{orderConfirmation.description.replace("{email}", order.userEmail ?? "")}
						</p>
					</div>
				</div>

				<div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
					<p className="text-sm font-semibold text-neutral-700">{orderConfirmation.estimatedDeliveryTitle}</p>
					<p className="mt-1 text-sm text-neutral-500">{orderConfirmation.estimatedDeliveryValue}</p>
				</div>

				<OrderInfo />

				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<a
						href={`/${locale}`}
						className="flex-1 rounded-md bg-[#2d6a4f] px-6 py-3 text-center text-sm font-medium text-white hover:bg-[#235c43]"
					>
						{orderConfirmation.continueShopping}
					</a>
					<button
						onClick={() => window.print()}
						className="flex-1 rounded-md border border-neutral-300 px-6 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
					>
						{orderConfirmation.printOrder}
					</button>
				</div>

				<div className="mt-6 rounded-lg bg-[#e8f5ee] p-4 text-sm text-[#2d6a4f]">
					<a
						href="https://wa.me/971558711442"
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium underline hover:text-[#1a4a32]"
					>
						{orderConfirmation.needHelp}
					</a>
				</div>
			</div>
			<Suspense fallback={<SummarySkeleton />}>
				<Summary
					{...order}
					discount={order?.discounts?.find(({ type }) => type === "VOUCHER")?.amount}
					voucherCode={order?.voucher?.code}
					totalPrice={order?.total}
					subtotalPrice={order?.subtotal}
					editable={false}
				/>
			</Suspense>
		</main>
	);
};
