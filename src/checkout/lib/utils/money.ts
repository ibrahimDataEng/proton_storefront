import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { getCheckoutLocaleTag } from "@/checkout/lib/checkoutMessages";

export type Money = {
	currency: string;
	amount: number;
} | null;

export const getFormattedMoney = <TMoney extends Money>(
	money: MightNotExist<TMoney>,
	negative = false,
	locale?: string,
) => {
	if (!money) {
		return "";
	}

	const { amount, currency } = money;

	return new Intl.NumberFormat(getCheckoutLocaleTag(locale), {
		style: "currency",
		currency,
		currencyDisplay: "symbol",
	}).format(negative ? -amount : amount);
};
