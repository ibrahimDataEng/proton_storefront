import { PackageX, RotateCcw, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { executeGraphQL } from "@/lib/graphql";
import { OrderTrackingDocument } from "@/gql/graphql";
import { formatMoney } from "@/lib/utils";
import { Container } from "@/ui/components/Container";
import { EmptyState } from "@/ui/components/EmptyState";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { OrderTrackingTimeline } from "@/ui/components/orderTracking/OrderTrackingTimeline";
import { OrderTrackingSummary } from "@/ui/components/orderTracking/OrderTrackingSummary";
import { resolveStage } from "@/lib/orderTracking/resolveStage";

export const dynamic = "force-dynamic";

function formatDate(dateStr: string, locale: string) {
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(dateStr));
}

function HomeLink({ label }: { label: string }) {
	return (
		<LinkWithChannel
			href="/"
			className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
		>
			{label}
		</LinkWithChannel>
	);
}

function ContactLink({ label }: { label: string }) {
	return (
		<LinkWithChannel
			href="/pages/contact-us"
			className="inline-flex items-center justify-center rounded-lg border border-line-default px-5 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
		>
			{label}
		</LinkWithChannel>
	);
}

export default async function TrackOrderPage(props: {
	params: Promise<{ locale: string; channel: string; token: string }>;
}) {
	const { locale, token } = await props.params;
	const t = await getTranslations("orderTracking");

	// Public field only, no auth needed — order(id:)/orderByToken has no
	// permission requirement in Saleor 3.23.1, and every field this query
	// selects (status, chargeStatus, addresses, lines, metadata) is likewise
	// ungated for a normal order (see saleor/graphql/order/types.py). This
	// mirrors src/checkout/lib/getOrderCreatedAt.ts's own reasoning for the
	// same class of anonymous order read.
	const { orderByToken: order } = await executeGraphQL(OrderTrackingDocument, {
		variables: { token },
		withAuth: false,
		cache: "no-cache",
	});

	if (!order) {
		return (
			<Container size="sm" className="py-16">
				<EmptyState
					icon={<SearchX className="h-16 w-16" aria-hidden="true" />}
					title={t("notFoundTitle")}
					subtitle={t("notFoundBody")}
					action={<HomeLink label={t("backHome")} />}
				/>
			</Container>
		);
	}

	const resolved = resolveStage(order);

	if (resolved.kind === "cancelled") {
		return (
			<Container size="sm" className="py-16">
				<EmptyState
					icon={<PackageX className="h-16 w-16" aria-hidden="true" />}
					title={t("cancelledTitle")}
					subtitle={t("cancelledBody")}
					action={<ContactLink label={t("contactUs")} />}
				/>
			</Container>
		);
	}

	if (resolved.kind === "returned") {
		return (
			<Container size="sm" className="py-16">
				<EmptyState
					icon={<RotateCcw className="h-16 w-16" aria-hidden="true" />}
					title={t("returnedTitle")}
					subtitle={t("returnedBody")}
					action={<ContactLink label={t("contactUs")} />}
				/>
			</Container>
		);
	}

	const showCodReminder =
		resolved.stage < 4 && order.metadata.some((item) => item.key === "paymentMethod" && item.value === "cod");

	return (
		<Container size="md" className="py-10 sm:py-16">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold text-content-primary">{t("pageTitle")}</h1>
				<p className="mt-1 text-sm text-content-secondary">
					{t("orderNumber", { number: order.number })} &middot;{" "}
					{t("orderDate", { date: formatDate(order.created, locale) })}
				</p>
			</div>

			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle sm:p-8">
				<OrderTrackingTimeline currentStage={resolved.stage} />

				{showCodReminder && (
					<p className="mt-6 rounded-lg bg-surface-sunken px-4 py-3 text-center text-sm font-medium text-content-primary">
						{t("codDueOnDelivery", {
							amount: formatMoney(order.total.gross.amount, order.total.gross.currency),
						})}
					</p>
				)}
			</div>

			<div className="mt-8 rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle sm:p-8">
				<OrderTrackingSummary order={order} />
			</div>
		</Container>
	);
}
