import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { type ReactNode } from "react";
import { requireAdminPage } from "@/lib/returns/adminPage";
import {
	fetchOrderForReturn,
	getReturnsAppToken,
	ORDER_UUID_PATTERN,
	orderUuidToGlobalId,
} from "@/lib/returns/returnOrders";
import {
	formatUaeDateTime,
	getReturnReason,
	getReturnStatus,
	readMetadataDate,
	readMetadataRaw,
	RETURN_METADATA_KEYS,
	toUaeDateTimeLocalValue,
} from "@/lib/returns/returnMetadata";
import { detectPaymentMethod } from "@/lib/courier/orderEligibility";
import { formatMoney } from "@/lib/utils";
import { Container } from "@/ui/components/Container";
import { EmptyState } from "@/ui/components/EmptyState";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { ReturnStatusBadge } from "@/ui/components/returns/ReturnStatusBadge";
import { AdminReturnActions } from "@/ui/components/returns/AdminReturnActions";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-line-subtle py-3 last:border-b-0 sm:flex-row sm:gap-4">
			<dt className="text-sm text-content-secondary sm:w-40 sm:shrink-0">{label}</dt>
			<dd className="min-w-0 text-sm text-content-primary">{children}</dd>
		</div>
	);
}

export default async function AdminReturnDetailPage(props: {
	params: Promise<{ locale: string; channel: string; orderId: string }>;
}) {
	const { locale, channel, orderId } = await props.params;
	await requireAdminPage(locale, channel);
	const t = await getTranslations("returnsAdmin");
	const tReasons = await getTranslations("account.returnReasons");

	// The URL carries the order's raw UUID (same as the tracking page: a base64
	// global id can contain "/" or "+", unsafe in a path segment of an emailed link).
	if (!ORDER_UUID_PATTERN.test(orderId)) notFound();

	const appToken = getReturnsAppToken();
	if (!appToken) {
		console.error("[returns-admin] SALEOR_RETURNS_APP_TOKEN is not configured");
		return (
			<Container size="sm" className="py-16">
				<EmptyState
					icon={<RotateCcw className="h-16 w-16" aria-hidden="true" />}
					title={t("configErrorTitle")}
					subtitle={t("configErrorBody")}
				/>
			</Container>
		);
	}

	let order;
	try {
		order = await fetchOrderForReturn(orderUuidToGlobalId(orderId), appToken);
	} catch (error) {
		console.error("[returns-admin] failed to load order:", error);
		notFound();
	}
	if (!order || order.channel.slug !== channel) notFound();

	const metadata = order.metadata;
	const status = getReturnStatus(metadata);
	const reason = getReturnReason(metadata);
	const details = readMetadataRaw(metadata, RETURN_METADATA_KEYS.details);
	const date = (key: string) => {
		const value = readMetadataDate(metadata, key);
		return value ? formatUaeDateTime(value, locale) : null;
	};
	const deliveredLabel = date("deliveredAt");
	const requestedLabel = date(RETURN_METADATA_KEYS.requestedAt);
	const pickupDate = readMetadataDate(metadata, RETURN_METADATA_KEYS.pickupExpectedAt);
	const receivedLabel = date(RETURN_METADATA_KEYS.receivedAt);
	const refundedLabel = date(RETURN_METADATA_KEYS.refundedAt);
	const rejectedNote = readMetadataRaw(metadata, RETURN_METADATA_KEYS.rejectedReason);

	const address = order.shippingAddress;
	const customerName =
		[order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
		[address?.firstName, address?.lastName].filter(Boolean).join(" ");
	const customerEmail = order.userEmail || order.user?.email || "";
	const paymentMethod = detectPaymentMethod(metadata);
	const paymentLabel =
		paymentMethod === "cod"
			? t("paymentCod")
			: paymentMethod === "card"
				? t("paymentCard")
				: t("paymentUnknown");

	return (
		<Container size="md" className="py-6 sm:py-10">
			<LinkWithChannel
				href="/admin/returns"
				className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
			>
				<ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
				{t("backToList")}
			</LinkWithChannel>

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<h1 className="text-xl font-semibold text-content-primary sm:text-2xl">
					{t("orderNumber", { number: order.number })}
				</h1>
				{status && <ReturnStatusBadge status={status} />}
			</div>

			{!status ? (
				<EmptyState
					icon={<RotateCcw className="h-16 w-16" aria-hidden="true" />}
					title={t("noReturnTitle")}
					subtitle={t("noReturnBody")}
				/>
			) : (
				<div className="flex flex-col gap-6">
					<section className="rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle sm:p-6">
						<dl>
							<Row label={t("customer")}>
								<p>{customerName || "—"}</p>
								{customerEmail && <p className="text-content-secondary">{customerEmail}</p>}
								{address?.phone && (
									<p className="text-content-secondary">
										<a href={`tel:${address.phone}`} dir="ltr" className="hover:text-brand-primary">
											{address.phone}
										</a>
									</p>
								)}
							</Row>
							<Row label={t("deliveredAt")}>{deliveredLabel ?? "—"}</Row>
							<Row label={t("requestedAt")}>{requestedLabel ?? "—"}</Row>
							<Row label={t("reason")}>
								<span className="font-semibold">{reason ? tReasons(reason) : "—"}</span>
							</Row>
							<Row label={t("details")}>
								{details ? (
									<p className="whitespace-pre-line break-words">{details}</p>
								) : (
									<span className="text-content-secondary">{t("noDetails")}</span>
								)}
							</Row>
							<Row label={t("paymentMethod")}>{paymentLabel}</Row>
							<Row label={t("total")}>
								{formatMoney(order.total.gross.amount, order.total.gross.currency)}
							</Row>
							{pickupDate && (
								<Row label={t("pickupExpected")}>
									{formatUaeDateTime(pickupDate, locale)} ({t("uaeTime")})
								</Row>
							)}
							{status === "rejected" && rejectedNote && (
								<Row label={t("rejectedNote")}>
									<p className="whitespace-pre-line break-words">{rejectedNote}</p>
								</Row>
							)}
							{receivedLabel && <Row label={t("receivedAt")}>{receivedLabel}</Row>}
							{refundedLabel && <Row label={t("refundedAt")}>{refundedLabel}</Row>}
						</dl>
					</section>

					<section className="rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle sm:p-6">
						<h2 className="mb-3 text-base font-semibold text-content-primary">{t("items")}</h2>
						<ul className="flex flex-col gap-3">
							{order.lines.map((line) => (
								<li key={line.id} className="flex items-start gap-3">
									{line.thumbnail && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={line.thumbnail.url}
											alt={line.thumbnail.alt ?? line.productName}
											className="h-12 w-12 rounded-lg object-cover"
										/>
									)}
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium text-content-primary">{line.productName}</p>
										{line.variantName && <p className="text-xs text-content-secondary">{line.variantName}</p>}
										<p className="text-xs text-content-secondary">× {line.quantity}</p>
									</div>
									<p className="text-sm font-semibold text-content-primary">
										{formatMoney(line.totalPrice.gross.amount, line.totalPrice.gross.currency)}
									</p>
								</li>
							))}
						</ul>
					</section>

					<AdminReturnActions
						orderId={order.id}
						status={status}
						channel={channel}
						minPickupValue={toUaeDateTimeLocalValue(new Date())}
						currentPickupValue={pickupDate ? toUaeDateTimeLocalValue(pickupDate) : ""}
						refundedInSaleorLabel={
							order.totalRefunded.amount > 0
								? formatMoney(order.totalRefunded.amount, order.totalRefunded.currency)
								: null
						}
					/>
				</div>
			)}
		</Container>
	);
}
