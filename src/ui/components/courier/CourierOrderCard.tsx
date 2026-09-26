"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { CourierConfirmDeliveryModal } from "./CourierConfirmDeliveryModal";
import { CourierCustomerContact } from "./CourierCustomerContact";
import { type CourierWorklistOrderFragment } from "@/gql/graphql";
import { Button } from "@/ui/components/Button";
import { formatMoney } from "@/lib/utils";
import { detectPaymentMethod, outstandingAmount } from "@/lib/courier/orderEligibility";
import { markOrderDelivered } from "@/app/[locale]/[channel]/(main)/courier/actions";

type Props = {
	order: CourierWorklistOrderFragment;
	locale: string;
	channel: string;
};

export function CourierOrderCard({ order, locale, channel }: Props) {
	const t = useTranslations("courier");
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const address = order.shippingAddress;
	const customerName =
		[address?.firstName, address?.lastName].filter(Boolean).join(" ") || order.userEmail || "";
	const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);
	const paymentMethod = detectPaymentMethod(order.metadata);
	const codAmount = outstandingAmount({
		grossAmount: order.total.gross.amount,
		chargedAmount: order.totalCharged.amount,
	});

	function handleConfirm() {
		setError(null);
		startTransition(async () => {
			const result = await markOrderDelivered(order.id, channel, locale);
			if (result.ok) {
				setIsConfirmOpen(false);
				if (!result.emailSent) {
					setNotice(t("emailFailedNotice"));
				}
			} else {
				setError(t(`errors.${result.error}`));
			}
		});
	}

	return (
		<div className="flex flex-col gap-3 rounded-2xl bg-surface-base p-4 shadow-raised ring-1 ring-line-subtle sm:p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-base font-semibold text-content-primary">
						{t("orderNumber", { number: order.number })}
					</p>
					<p className="text-sm text-content-secondary">{customerName}</p>
				</div>
				<div className="flex items-center gap-1 rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-content-secondary">
					<Package className="h-3.5 w-3.5" aria-hidden="true" />
					{t("itemCount", { count: itemCount })}
				</div>
			</div>

			<CourierCustomerContact address={address} />

			<div className="rounded-lg bg-surface-sunken px-3 py-2 text-sm">
				{paymentMethod === "cod" && (
					<span className="font-semibold text-content-primary">
						{t("collectCash", { amount: formatMoney(codAmount, order.total.gross.currency) })}
					</span>
				)}
				{paymentMethod === "card" && <span className="text-content-secondary">{t("alreadyPaid")}</span>}
				{paymentMethod === "unknown" && <span className="text-status-warning">{t("paymentUnknown")}</span>}
			</div>

			{notice && <p className="text-sm text-status-warning">{notice}</p>}

			<Button
				type="button"
				variant="primary"
				size="lg"
				className="w-full"
				onClick={() => setIsConfirmOpen(true)}
			>
				{t("markDelivered")}
			</Button>

			<CourierConfirmDeliveryModal
				isOpen={isConfirmOpen}
				onClose={() => {
					if (!isPending) setIsConfirmOpen(false);
				}}
				onConfirm={handleConfirm}
				orderNumber={order.number}
				paymentMethod={paymentMethod}
				codAmount={codAmount}
				currency={order.total.gross.currency}
				isSubmitting={isPending}
				error={error}
			/>
		</div>
	);
}
