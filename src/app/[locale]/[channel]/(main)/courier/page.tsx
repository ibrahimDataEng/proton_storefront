import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PackageCheck } from "lucide-react";
import { executeGraphQL } from "@/lib/graphql";
import { CourierWorklistDocument } from "@/gql/graphql";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { resolveCourier } from "@/lib/courier";
import { isMarkedDelivered } from "@/lib/courier/orderEligibility";
import { Container } from "@/ui/components/Container";
import { EmptyState } from "@/ui/components/EmptyState";
import { CourierWorklist } from "@/ui/components/courier/CourierWorklist";

export const dynamic = "force-dynamic";

const COURIER_APP_TOKEN = process.env.SALEOR_COURIER_APP_TOKEN;

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

	const { orders } = await executeGraphQL(CourierWorklistDocument, {
		variables: { channel },
		withAuth: false,
		cache: "no-cache",
		headers: { Authorization: `Bearer ${COURIER_APP_TOKEN}` },
	});

	const pending = (orders?.edges ?? [])
		.map((edge) => edge.node)
		.filter((order) => !isMarkedDelivered(order.metadata));

	return (
		<Container size="md" className="py-6 sm:py-10">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-content-primary sm:text-2xl">{t("pageTitle")}</h1>
				<p className="mt-1 text-sm text-content-secondary">{t("pageSubtitle", { count: pending.length })}</p>
			</div>

			{pending.length === 0 ? (
				<EmptyState
					icon={<PackageCheck className="h-16 w-16" aria-hidden="true" />}
					title={t("emptyTitle")}
					subtitle={t("emptySubtitle")}
				/>
			) : (
				<CourierWorklist orders={pending} locale={locale} channel={channel} />
			)}
		</Container>
	);
}
