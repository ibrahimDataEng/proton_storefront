import { Suspense, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getOrderCreatedAt } from "@/checkout/lib/getOrderCreatedAt";
import { getPaymentGatewayForOrder } from "@/checkout/lib/lastPaymentGateway";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { codGatewayId } from "@/checkout/sections/PaymentSection/CODComponent/types";
import { trackPurchase } from "@/lib/analytics/gtag";
import { type DeliveryLabel, getDeliveryInfo } from "@/lib/delivery";

export const OrderConfirmation = () => {
	const { orderConfirmation } = useCheckoutMessages();
	const { order } = useOrder();
	const locale = useLocale();

	// null = not yet resolved (or the order.created fetch failed) — falls back
	// to the static estimatedDeliveryValue copy rather than showing nothing.
	const [deliveryLabel, setDeliveryLabel] = useState<DeliveryLabel | null>(null);
	const [isCod, setIsCod] = useState(false);

	useEffect(() => {
		// Session-local signal set by CODComponent right before completing
		// checkout — see lastPaymentGateway.ts for why this exists instead of
		// a GraphQL field (Order.transactions/events both require
		// MANAGE_ORDERS/HANDLE_PAYMENTS, not available to a guest here). Bound
		// to this order, so an earlier COD order in the same tab can't make a
		// card-paid order show the cash reminder.
		const orderId = order?.id ?? getQueryParams().orderId;
		if (!orderId) return;
		setIsCod(getPaymentGatewayForOrder(orderId) === codGatewayId);
	}, [order?.id]);

	useEffect(() => {
		if (!order?.id) return;
		let cancelled = false;
		void getOrderCreatedAt(order.id).then((created) => {
			if (cancelled || !created) return;
			setDeliveryLabel(getDeliveryInfo(created).label);
		});
		return () => {
			cancelled = true;
		};
	}, [order?.id]);

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

	const estimatedDeliveryValue =
		deliveryLabel === "tomorrow"
			? orderConfirmation.deliveryTomorrow
			: deliveryLabel === "dayAfterTomorrow"
				? orderConfirmation.deliveryDayAfterTomorrow
				: orderConfirmation.estimatedDeliveryValue;

	const statusSteps = [
		{ key: "received", label: orderConfirmation.statusReceived },
		{ key: "processing", label: orderConfirmation.statusProcessing },
		{ key: "shipped", label: orderConfirmation.statusShipped },
		{ key: "delivered", label: orderConfirmation.statusDelivered },
	] as const;

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
						<p className="mt-1 text-xs text-neutral-400">{orderConfirmation.checkSpamFolder}</p>
					</div>
				</div>

				<ol className="mb-6 flex items-center justify-between">
					{statusSteps.map((step, index) => (
						<li key={step.key} className="flex flex-1 items-center last:flex-none">
							<div className="flex flex-col items-center gap-1">
								<div
									className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
										index === 0 ? "bg-[#2d6a4f] text-white" : "bg-neutral-200 text-neutral-400"
									}`}
								>
									{index + 1}
								</div>
								<span
									className={`whitespace-nowrap text-[11px] ${
										index === 0 ? "font-semibold text-[#2d6a4f]" : "text-neutral-400"
									}`}
								>
									{step.label}
								</span>
							</div>
							{index < statusSteps.length - 1 && <div className="mx-2 h-px flex-1 bg-neutral-200" />}
						</li>
					))}
				</ol>

				<div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
					<p className="text-sm font-semibold text-neutral-700">{orderConfirmation.estimatedDeliveryTitle}</p>
					<p className="mt-1 text-sm text-neutral-500">{estimatedDeliveryValue}</p>
				</div>

				{isCod && (
					<div className="mb-6 rounded-lg bg-[#fff8e6] p-4 text-sm text-[#8a6d1a]">
						💵{" "}
						{orderConfirmation.codReminder.replace(
							"{amount}",
							order.total?.gross?.amount != null ? order.total.gross.amount.toFixed(2) : "",
						)}
					</div>
				)}

				<OrderInfo isCod={isCod} />

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
