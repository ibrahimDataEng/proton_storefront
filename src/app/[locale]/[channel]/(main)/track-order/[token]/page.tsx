import { type ReactNode } from "react";
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

// order(id:) rejects a malformed global id as a GraphQL error (not a clean
// `null`) — e.g. base64-encoding "Order:not-a-uuid" still decodes to a
// well-formed "Order:<garbage>" global id, which Saleor then refuses with
// "Invalid ID: ... Expected: Order." (confirmed live: this surfaced as an
// uncaught GraphQLError from executeGraphQL, crashing the page with a 500,
// where orderByToken's UUID!-typed argument would have failed differently).
// Validating the token's shape before ever building the global id or calling
// GraphQL keeps a malformed/mistyped URL on the graceful not-found path,
// matching this page's "never an error, never a broken render" requirement.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function NotFoundView({ title, subtitle, action }: { title: string; subtitle: string; action: ReactNode }) {
	return (
		<Container size="sm" className="py-16">
			<EmptyState
				icon={<SearchX className="h-16 w-16" aria-hidden="true" />}
				title={title}
				subtitle={subtitle}
				action={action}
			/>
		</Container>
	);
}

export default async function TrackOrderPage(props: {
	params: Promise<{ locale: string; channel: string; token: string }>;
}) {
	const { locale, token } = await props.params;
	const t = await getTranslations("orderTracking");

	if (!UUID_PATTERN.test(token)) {
		return (
			<NotFoundView
				title={t("notFoundTitle")}
				subtitle={t("notFoundBody")}
				action={<HomeLink label={t("backHome")} />}
			/>
		);
	}

	// The URL carries the order's raw UUID (Order.id). order(id:) expects the
	// relay global id, not the raw UUID, so it's converted here rather than in
	// the URL itself — a base64 global id can contain "/" or "+", a real
	// path-segment escaping hazard for a literal link pasted into an email
	// client. orderByToken(token: UUID!) would take the raw UUID directly but
	// is deprecated (removal targeted for Saleor 4.0); order(id:) is not.
	const globalId = Buffer.from(`Order:${token}`).toString("base64");

	// Public field only, no auth needed — order(id:) has no permission
	// requirement in Saleor 3.23.1 (only the separate externalReference lookup
	// arm requires MANAGE_ORDERS), and every field this query selects (status,
	// chargeStatus, addresses, lines, metadata) is likewise ungated for a
	// normal order (see saleor/graphql/order/types.py). This mirrors
	// src/checkout/lib/getOrderCreatedAt.ts's own reasoning for the same class
	// of anonymous order read.
	const { order } = await executeGraphQL(OrderTrackingDocument, {
		variables: { id: globalId },
		withAuth: false,
		cache: "no-cache",
	});

	if (!order) {
		return (
			<NotFoundView
				title={t("notFoundTitle")}
				subtitle={t("notFoundBody")}
				action={<HomeLink label={t("backHome")} />}
			/>
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
