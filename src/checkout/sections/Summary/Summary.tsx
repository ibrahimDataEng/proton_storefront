import { type FC } from "react";
import clsx from "clsx";
import { SummaryItem, type SummaryLine } from "./SummaryItem";
import { PromoCodeAdd } from "./PromoCodeAdd";
import { SummaryMoneyRow } from "./SummaryMoneyRow";
import { SummaryPromoCodeRow } from "./SummaryPromoCodeRow";
import { SummaryItemMoneyEditableSection } from "./SummaryItemMoneyEditableSection";
import { ChevronDownIcon } from "@/checkout/ui-kit/icons";
import { Divider, Money, Title } from "@/checkout/components";
import {
	type CheckoutLineFragment,
	type GiftCardFragment,
	type Money as MoneyType,
	type OrderLineFragment,
} from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { SummaryItemMoneySection } from "@/checkout/sections/Summary/SummaryItemMoneySection";
import { type GrossMoney, type GrossMoneyWithTax } from "@/checkout/lib/globalTypes";

interface SummaryProps {
	editable?: boolean;
	lines: SummaryLine[];
	totalPrice?: GrossMoneyWithTax;
	subtotalPrice?: GrossMoney;
	giftCards?: GiftCardFragment[];
	voucherCode?: string | null;
	discount?: MoneyType | null;
	shippingPrice: GrossMoney;
}

export const Summary: FC<SummaryProps> = ({
	editable = true,
	lines,
	totalPrice,
	subtotalPrice,
	giftCards = [],
	voucherCode,
	shippingPrice,
	discount,
}) => {
	const { summary, locale } = useCheckoutMessages();

	return (
		<div
			className={clsx(
				"z-0 flex h-fit w-full flex-col",
				"before:fixed before:bottom-0 before:left-1/2 before:top-0 before:-z-10 before:w-1/2 before:border-l before:border-neutral-100 before:bg-[#f8faf9] before:content-none before:lg:content-['']",
			)}
		>
			<details open className="group">
				<summary className="-mb-2 flex cursor-pointer flex-row items-center pt-4">
					<Title>{summary.title}</Title>
					<ChevronDownIcon className="mb-2 group-open:rotate-180" />
				</summary>
				<ul className="py-2" data-testid="SummaryProductList">
					{lines.map((line) => (
						<SummaryItem line={line} key={line?.id}>
							{editable ? (
								<SummaryItemMoneyEditableSection line={line as CheckoutLineFragment} />
							) : (
								<SummaryItemMoneySection line={line as OrderLineFragment} />
							)}
						</SummaryItem>
					))}
				</ul>
			</details>
			{editable && (
				<>
					<PromoCodeAdd />
					<Divider />
				</>
			)}
			<div className="mt-4 flex max-w-full flex-col">
				<SummaryMoneyRow
					label={summary.subtotal}
					money={subtotalPrice?.gross}
					ariaLabel={summary.subtotalPriceAria}
				/>
				{voucherCode && (
					<SummaryPromoCodeRow
						editable={editable}
						promoCode={voucherCode}
						ariaLabel={summary.voucherAria}
						label={summary.voucherCode.replace("{code}", voucherCode)}
						money={discount}
						negative
					/>
				)}
				{giftCards.map(({ currentBalance, displayCode, id }) => (
					<SummaryPromoCodeRow
						key={id}
						editable={editable}
						promoCodeId={id}
						ariaLabel={summary.giftCardAria}
						label={summary.giftCard.replace("{code}", displayCode)}
						money={currentBalance}
						negative
					/>
				))}
				<SummaryMoneyRow
					label={summary.shippingCost}
					ariaLabel={summary.shippingCostAria}
					money={shippingPrice?.gross}
				/>
				<Divider className="my-4" />
				<div className="flex flex-row items-baseline justify-between pb-4">
					<div className="flex flex-row items-baseline">
						<p className="font-bold">{summary.totalPrice}</p>
						<p color="secondary" className="ml-2">
							{summary.includesTax.replace("{tax}", getFormattedMoney(totalPrice?.tax, false, locale))}
						</p>
					</div>
					<Money ariaLabel={summary.totalPriceAria} money={totalPrice?.gross} data-testid="totalOrderPrice" />
				</div>
			</div>
		</div>
	);
};
