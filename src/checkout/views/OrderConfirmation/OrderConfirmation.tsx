import { Suspense } from "react";
import { useLocale } from "next-intl";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export const OrderConfirmation = () => {
	const { orderConfirmation } = useCheckoutMessages();
	const { order } = useOrder();
	const locale = useLocale();

	return (
		<main className="grid grid-cols-1 gap-x-16 lg:grid-cols-2" dir={locale === "ar" ? "rtl" : "ltr"}>
			<div>
				<div className="mb-6 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<p className="text-lg font-bold text-green-700" data-testid="orderConfrmationTitle">
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
						className="flex-1 rounded-md bg-black px-6 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800"
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

				<div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
					{orderConfirmation.needHelp}
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
