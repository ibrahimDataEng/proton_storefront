"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Phone, MapPin, Package } from "lucide-react";
import { CourierConfirmDeliveryModal } from "./CourierConfirmDeliveryModal";
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

function toWhatsAppLink(phone: string): string {
	const digits = phone.replace(/[^\d]/g, "");
	return `https://wa.me/${digits}`;
}

function formatAddressLines(address: CourierWorklistOrderFragment["shippingAddress"]): string[] {
	if (!address) return [];
	return [
		[address.streetAddress1, address.streetAddress2].filter(Boolean).join(", "),
		[address.city, address.countryArea].filter(Boolean).join(", "),
		address.country?.country,
	].filter((line): line is string => Boolean(line));
}

function mapsLink(address: CourierWorklistOrderFragment["shippingAddress"]): string | null {
	if (!address) return null;
	const query = [address.streetAddress1, address.city, address.countryArea, address.country?.country]
		.filter(Boolean)
		.join(", ");
	if (!query) return null;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function CourierOrderCard({ order, locale, channel }: Props) {
	const t = useTranslations("courier");
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const address = order.shippingAddress;
	const customerName =
		[address?.firstName, address?.lastName].filter(Boolean).join(" ") || order.userEmail || "";
	const phone = address?.phone;
	const addressLines = formatAddressLines(address);
	const maps = mapsLink(address);
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

			{phone && (
				<div className="flex flex-wrap items-center gap-3 text-sm">
					<a
						href={`tel:${phone}`}
						dir="ltr"
						className="inline-flex items-center gap-1.5 font-medium text-content-primary hover:text-brand-primary"
					>
						<Phone className="h-4 w-4" aria-hidden="true" />
						{phone}
					</a>
					<a
						href={toWhatsAppLink(phone)}
						target="_blank"
						rel="noopener noreferrer"
						className="text-status-success underline-offset-2 hover:underline"
					>
						{t("whatsapp")}
					</a>
				</div>
			)}

			{addressLines.length > 0 && (
				<div className="flex items-start gap-1.5 text-sm text-content-secondary">
					<MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
					<div className="flex flex-col">
						{addressLines.map((line, i) => (
							<span key={i}>{line}</span>
						))}
						{maps && (
							<a
								href={maps}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-1 text-brand-primary underline-offset-2 hover:underline"
							>
								{t("openInMaps")}
							</a>
						)}
					</div>
				</div>
			)}

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
