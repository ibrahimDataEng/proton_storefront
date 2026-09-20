import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/utils";
import type { OrderTrackingQuery } from "@/gql/graphql";

type Order = NonNullable<OrderTrackingQuery["orderByToken"]>;

export function OrderTrackingSummary({ order }: { order: Order }) {
	const t = useTranslations("orderTracking");
	const shippingAddress = order.shippingAddress;

	return (
		<div className="grid gap-6 sm:grid-cols-2">
			<div>
				<h2 className="mb-3 text-sm font-semibold text-content-primary">{t("itemsTitle")}</h2>
				<ul className="flex flex-col gap-3">
					{order.lines.map((line) => (
						<li key={line.id} className="flex items-center gap-3">
							{line.thumbnail ? (
								<Image
									src={line.thumbnail.url}
									alt={line.thumbnail.alt ?? ""}
									width={48}
									height={48}
									className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-line-subtle"
								/>
							) : (
								<div className="h-12 w-12 shrink-0 rounded-lg bg-surface-sunken ring-1 ring-line-subtle" />
							)}
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-sm text-content-primary">
									{line.productName}
									{line.variantName ? (
										<span className="text-content-secondary"> ({line.variantName})</span>
									) : null}
								</span>
								<span className="text-xs text-content-secondary">×{line.quantity}</span>
							</div>
							<span className="shrink-0 text-sm text-content-primary">
								{formatMoney(line.totalPrice.gross.amount, line.totalPrice.gross.currency)}
							</span>
						</li>
					))}
				</ul>
				<div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-3 text-sm font-semibold text-content-primary">
					<span>{t("total")}</span>
					<span>{formatMoney(order.total.gross.amount, order.total.gross.currency)}</span>
				</div>
			</div>

			{shippingAddress ? (
				<div>
					<h2 className="mb-3 text-sm font-semibold text-content-primary">{t("shippingAddress")}</h2>
					<address className="text-sm not-italic leading-relaxed text-content-secondary">
						{shippingAddress.firstName} {shippingAddress.lastName}
						<br />
						{shippingAddress.streetAddress1}
						{shippingAddress.streetAddress2 ? `, ${shippingAddress.streetAddress2}` : ""}
						<br />
						{shippingAddress.city}
						{shippingAddress.countryArea ? `, ${shippingAddress.countryArea}` : ""}
						<br />
						{shippingAddress.country.country}
						{shippingAddress.phone ? (
							<>
								<br />
								<span dir="ltr">{shippingAddress.phone}</span>
							</>
						) : null}
					</address>
				</div>
			) : null}
		</div>
	);
}
