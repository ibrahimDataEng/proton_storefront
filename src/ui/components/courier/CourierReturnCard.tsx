"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Package } from "lucide-react";
import { CourierConfirmPickupModal } from "./CourierConfirmPickupModal";
import { CourierCustomerContact } from "./CourierCustomerContact";
import { type CourierWorklistOrderFragment } from "@/gql/graphql";
import { type ReturnReason } from "@/lib/returns/returnCodes";
import { Button } from "@/ui/components/Button";
import { markReturnPickedUp } from "@/app/[locale]/[channel]/(main)/courier/actions";

type Props = {
	order: CourierWorklistOrderFragment;
	/** Pre-formatted server-side (UAE time) so server and browser render the same string. */
	pickupLabel: string | null;
	reason: ReturnReason | null;
	locale: string;
	channel: string;
};

export function CourierReturnCard({ order, pickupLabel, reason, locale, channel }: Props) {
	const t = useTranslations("courier");
	const tReasons = useTranslations("account.returnReasons");
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const address = order.shippingAddress;
	const customerName =
		[address?.firstName, address?.lastName].filter(Boolean).join(" ") || order.userEmail || "";
	const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

	function handleConfirm() {
		setError(null);
		startTransition(async () => {
			const result = await markReturnPickedUp(order.id, channel, locale);
			if (result.ok) {
				setIsConfirmOpen(false);
				if (!result.emailSent) setNotice(t("pickupEmailFailedNotice"));
			} else {
				setError(t(`returnErrors.${result.error}`));
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

			{pickupLabel && (
				<p className="flex items-center gap-1.5 rounded-lg bg-status-warning/10 px-3 py-2 text-sm font-semibold text-content-primary">
					<CalendarClock className="h-4 w-4 shrink-0 text-status-warning" aria-hidden="true" />
					{t("pickupAt", { time: pickupLabel })}
				</p>
			)}

			{reason && (
				<p className="text-sm text-content-secondary">{t("returnReason", { reason: tReasons(reason) })}</p>
			)}

			<CourierCustomerContact address={address} />

			{notice && <p className="text-sm text-status-warning">{notice}</p>}

			<Button
				type="button"
				variant="primary"
				size="lg"
				className="w-full"
				onClick={() => setIsConfirmOpen(true)}
			>
				{t("markPickedUp")}
			</Button>

			<CourierConfirmPickupModal
				isOpen={isConfirmOpen}
				onClose={() => {
					if (!isPending) setIsConfirmOpen(false);
				}}
				onConfirm={handleConfirm}
				orderNumber={order.number}
				isSubmitting={isPending}
				error={error}
			/>
		</div>
	);
}
