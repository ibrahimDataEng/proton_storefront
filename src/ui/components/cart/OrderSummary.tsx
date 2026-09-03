import { getTranslations } from "next-intl/server";
import { PromoCodeField } from "./PromoCodeField";
import { CartViewTracker } from "./CartViewTracker";
import type { CheckoutFindQuery } from "@/gql/graphql";
import { formatMoney } from "@/lib/utils";
import { CheckoutLink } from "@/app/[locale]/[channel]/(main)/cart/CheckoutLink";

const FREE_SHIPPING_THRESHOLD = 200;

type CheckoutLine = NonNullable<CheckoutFindQuery["checkout"]>["lines"][number];

interface OrderSummaryProps {
	lines: CheckoutLine[];
	totalPrice: { amount: number; currency: string };
	checkoutId: string;
	appliedVoucherCode?: string | null;
	discount?: { amount: number; currency: string } | null;
}

export async function OrderSummary({
	lines,
	totalPrice,
	checkoutId,
	appliedVoucherCode,
	discount,
}: OrderSummaryProps) {
	const t = await getTranslations("cart");

	const subtotal = lines.reduce((sum, line) => sum + line.totalPrice.gross.amount, 0);
	const currency = totalPrice.currency;
	const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
	const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
	const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
	const hasDiscount = discount && discount.amount > 0;

	return (
		<div className="sticky top-24 rounded-2xl border border-line-subtle bg-surface-raised p-6 shadow-raised">
			<CartViewTracker
				checkoutId={checkoutId}
				value={totalPrice.amount}
				items={lines.map((line) => ({
					item_id: line.variant.id,
					item_name: line.variant.product.translation?.name || line.variant.product.name,
					item_category:
						line.variant.product.category?.translation?.name ||
						line.variant.product.category?.name ||
						undefined,
					price: line.variant.pricing?.price?.gross.amount,
					quantity: line.quantity,
				}))}
			/>
			<div className="space-y-3">
				<div className="flex justify-between text-sm">
					<span className="text-content-secondary">{t("subtotal")}</span>
					<span className="font-medium text-content-primary">{formatMoney(subtotal, currency)}</span>
				</div>
				{hasDiscount && (
					<div className="flex justify-between text-sm">
						<span className="text-content-secondary">{t("discount")}</span>
						<span className="font-medium text-brand-primary">
							−{formatMoney(discount.amount, discount.currency)}
						</span>
					</div>
				)}
				<div className="flex justify-between text-sm">
					<span className="text-content-secondary">{t("shipping")}</span>
					<span className="font-medium text-content-primary">{t("shippingCalculated")}</span>
				</div>
			</div>

			<div className="my-4 h-px bg-line-subtle" />

			<div className="flex items-center justify-between">
				<span className="font-semibold text-content-primary">{t("grandTotal")}</span>
				<span className="text-lg font-bold text-brand-primary">
					{formatMoney(totalPrice.amount, totalPrice.currency)}
				</span>
			</div>
			<p className="mt-1 text-right text-xs text-content-secondary">{t("taxIncluded")}</p>

			{/* Free shipping progress */}
			<div className="mt-5">
				{hasFreeShipping ? (
					<p className="text-sm font-medium text-status-success">{t("freeShippingUnlocked")}</p>
				) : (
					<>
						<p className="mb-2 text-sm text-content-secondary">
							{t("freeShippingProgress", { amount: formatMoney(remaining, currency) })}
						</p>
						<div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
							<div
								className="h-full rounded-full bg-brand-primary transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</>
				)}
			</div>

			{/* Promo code */}
			<div className="mt-5">
				<PromoCodeField checkoutId={checkoutId} appliedVoucherCode={appliedVoucherCode} discount={discount} />
			</div>

			{/* Checkout button */}
			<div className="mt-5">
				<CheckoutLink checkoutId={checkoutId} />
			</div>
		</div>
	);
}
