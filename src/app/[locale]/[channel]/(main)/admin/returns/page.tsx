import { getTranslations } from "next-intl/server";
import { RotateCcw } from "lucide-react";
import { executeGraphQL } from "@/lib/graphql";
import { ReturnOrdersByStatusDocument, type ReturnOrderFragment } from "@/gql/graphql";
import { requireAdminPage } from "@/lib/returns/adminPage";
import { getReturnsAppToken } from "@/lib/returns/returnOrders";
import {
	formatUaeDateTime,
	getReturnReason,
	getReturnStatus,
	readMetadataDate,
	RETURN_METADATA_KEYS,
	type ReturnStatus,
} from "@/lib/returns/returnMetadata";
import { orderGlobalIdToUuid } from "@/lib/courier/orderEligibility";
import { Container } from "@/ui/components/Container";
import { EmptyState } from "@/ui/components/EmptyState";
import { AdminReturnListCard } from "@/ui/components/returns/AdminReturnListCard";

export const dynamic = "force-dynamic";

const LISTED_STATUSES: ReturnStatus[] = ["requested", "pickup_scheduled", "item_received"];

function requestedAtMs(order: ReturnOrderFragment): number {
	return readMetadataDate(order.metadata, RETURN_METADATA_KEYS.requestedAt)?.getTime() ?? 0;
}

export default async function AdminReturnsPage(props: {
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await props.params;
	await requireAdminPage(locale, channel);
	const t = await getTranslations("returnsAdmin");

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

	const { orders } = await executeGraphQL(ReturnOrdersByStatusDocument, {
		variables: { channel, statuses: LISTED_STATUSES },
		withAuth: false,
		cache: "no-cache",
		headers: { Authorization: `Bearer ${appToken}` },
	});

	// Newest request first (the query sorts by order creation; Saleor can't sort
	// on metadata, so this re-sorts by returnRequestedAt — stable for ties).
	const all = (orders?.edges ?? [])
		.map((edge) => edge.node)
		.sort((a, b) => requestedAtMs(b) - requestedAtMs(a));
	const byStatus = (status: ReturnStatus) =>
		all.filter((order) => getReturnStatus(order.metadata) === status);

	const sections: { status: ReturnStatus; title: string; empty: string }[] = [
		{ status: "requested", title: t("sectionRequested"), empty: t("emptyRequested") },
		{ status: "pickup_scheduled", title: t("sectionPickupScheduled"), empty: t("emptySection") },
		{ status: "item_received", title: t("sectionItemReceived"), empty: t("emptySection") },
	];
	const requestedCount = byStatus("requested").length;

	return (
		<Container size="md" className="py-6 sm:py-10">
			<h1 className="text-xl font-semibold text-content-primary sm:text-2xl">{t("pageTitle")}</h1>
			<p className="mb-8 mt-1 text-sm text-content-secondary">
				{t("pageSubtitle", { count: requestedCount })}
			</p>

			{sections.map((section) => {
				const list = byStatus(section.status);
				return (
					<section key={section.status} aria-labelledby={`returns-${section.status}`} className="mb-10">
						<h2 id={`returns-${section.status}`} className="mb-4 text-lg font-semibold text-content-primary">
							{section.title}
						</h2>
						{list.length === 0 ? (
							<p className="rounded-2xl bg-surface-sunken px-4 py-6 text-center text-sm text-content-secondary">
								{section.empty}
							</p>
						) : (
							<ul className="flex flex-col gap-3">
								{list.map((order) => {
									const requestedAt = readMetadataDate(order.metadata, RETURN_METADATA_KEYS.requestedAt);
									const pickupAt = readMetadataDate(order.metadata, RETURN_METADATA_KEYS.pickupExpectedAt);
									return (
										<li key={order.id}>
											<AdminReturnListCard
												orderUuid={orderGlobalIdToUuid(order.id) ?? ""}
												orderNumber={order.number}
												customer={
													[order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
													order.userEmail ||
													""
												}
												status={section.status}
												reason={getReturnReason(order.metadata)}
												requestedLabel={requestedAt ? formatUaeDateTime(requestedAt, locale) : null}
												pickupLabel={
													section.status === "pickup_scheduled" && pickupAt
														? formatUaeDateTime(pickupAt, locale)
														: null
												}
											/>
										</li>
									);
								})}
							</ul>
						)}
					</section>
				);
			})}
		</Container>
	);
}
