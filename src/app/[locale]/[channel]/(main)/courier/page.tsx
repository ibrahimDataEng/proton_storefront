import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { executeGraphQL } from "@/lib/graphql";
import { CourierReturnPickupsDocument, CourierWorklistDocument } from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { resolveCourier } from "@/lib/courier";
import { isMarkedDelivered } from "@/lib/courier/orderEligibility";
import {
	formatUaeDateTime,
	getReturnReason,
	readMetadataDate,
	RETURN_METADATA_KEYS,
	type OrderMetadataEntry,
} from "@/lib/returns/returnMetadata";
import { Container } from "@/ui/components/Container";
import { EmptyState } from "@/ui/components/EmptyState";
import { CourierWorklist } from "@/ui/components/courier/CourierWorklist";
import { CourierReturnCard } from "@/ui/components/courier/CourierReturnCard";

export const dynamic = "force-dynamic";

const COURIER_APP_TOKEN = process.env.SALEOR_COURIER_APP_TOKEN;

function requestedAtMs(metadata: readonly OrderMetadataEntry[]): number {
	return readMetadataDate(metadata, RETURN_METADATA_KEYS.requestedAt)?.getTime() ?? 0;
}

export default async function CourierPage(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;
	const t = await getTranslations("courier");

	const cookieStore = await cookies();
	const hasSession = Boolean(cookieStore.get(COOKIE_ACCESS_TOKEN)?.value);
	if (!hasSession) {
		redirect(`/${locale}/${channel}/login`);
	}

	// Logged in but not a listed, active, non-staff courier: the generic
	// not-found view, on purpose — this page must not reveal its own existence
	// to an ordinary customer or staff account.
	const courier = await resolveCourier();
	if (!courier) {
		notFound();
	}

	if (!COURIER_APP_TOKEN) {
		console.error("[courier] SALEOR_COURIER_APP_TOKEN is not configured");
		return (
			<Container size="sm" className="py-16">
				<EmptyState
					icon={<PackageCheck className="h-16 w-16" aria-hidden="true" />}
					title={t("configErrorTitle")}
					subtitle={t("configErrorBody")}
				/>
			</Container>
		);
	}

	const headers = { Authorization: `Bearer ${COURIER_APP_TOKEN}` };
	const [{ orders }, { orders: returnOrders }] = await Promise.all([
		executeGraphQL(CourierWorklistDocument, {
			variables: { channel },
			withAuth: false,
			cache: "no-cache",
			headers,
		}),
		executeGraphQL(CourierReturnPickupsDocument, {
			variables: { channel },
			withAuth: false,
			cache: "no-cache",
			headers,
		}),
	]);

	// Newest first — the worklist query sorts CREATED_AT DESC.
	const pending = (orders?.edges ?? [])
		.map((edge) => edge.node)
		.filter((order) => !isMarkedDelivered(order.metadata));

	// Newest return request first. Saleor can't sort on metadata, so the query
	// sorts by order creation (DESC) and this re-sorts by returnRequestedAt; the
	// sort is stable, so orders missing the timestamp keep the query order.
	const pickups = (returnOrders?.edges ?? [])
		.map((edge) => edge.node)
		.sort((a, b) => requestedAtMs(b.metadata) - requestedAtMs(a.metadata));

	return (
		<Container size="md" className="py-6 sm:py-10">
			<h1 className="mb-6 text-xl font-semibold text-content-primary sm:text-2xl">{t("pageTitle")}</h1>

			<section aria-labelledby="courier-deliveries-heading" className="mb-10">
				<h2 id="courier-deliveries-heading" className="text-lg font-semibold text-content-primary">
					{t("deliveriesTitle")}
				</h2>
				<p className="mb-4 mt-1 text-sm text-content-secondary">
					{t("pageSubtitle", { count: pending.length })}
				</p>
				{pending.length === 0 ? (
					<EmptyState
						icon={<PackageCheck className="h-16 w-16" aria-hidden="true" />}
						title={t("emptyTitle")}
						subtitle={t("emptySubtitle")}
					/>
				) : (
					<CourierWorklist orders={pending} locale={locale} channel={channel} />
				)}
			</section>

			<section aria-labelledby="courier-returns-heading">
				<h2 id="courier-returns-heading" className="text-lg font-semibold text-content-primary">
					{t("returnsTitle")}
				</h2>
				<p className="mb-4 mt-1 text-sm text-content-secondary">
					{t("returnsSubtitle", { count: pickups.length })}
				</p>
				{pickups.length === 0 ? (
					<p className="rounded-2xl bg-surface-sunken px-4 py-6 text-center text-sm text-content-secondary">
						{t("returnsEmpty")}
					</p>
				) : (
					<ul className="flex flex-col gap-4">
						{pickups.map((order) => {
							const pickupAt = readMetadataDate(order.metadata, RETURN_METADATA_KEYS.pickupExpectedAt);
							return (
								<li key={order.id}>
									<CourierReturnCard
										order={order}
										pickupLabel={pickupAt ? formatUaeDateTime(pickupAt, locale) : null}
										reason={getReturnReason(order.metadata)}
										locale={locale}
										channel={channel}
									/>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</Container>
	);
}
