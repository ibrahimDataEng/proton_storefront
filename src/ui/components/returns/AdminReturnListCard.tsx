import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { type ReturnReason, type ReturnStatus } from "@/lib/returns/returnCodes";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { ReturnStatusBadge } from "@/ui/components/returns/ReturnStatusBadge";

type Props = {
	orderUuid: string;
	orderNumber: string;
	customer: string;
	status: ReturnStatus;
	reason: ReturnReason | null;
	requestedLabel: string | null;
	pickupLabel: string | null;
};

/** One row on /admin/returns — the whole card links to that order's review page. */
export function AdminReturnListCard({
	orderUuid,
	orderNumber,
	customer,
	status,
	reason,
	requestedLabel,
	pickupLabel,
}: Props) {
	const t = useTranslations("returnsAdmin");
	const tReasons = useTranslations("account.returnReasons");

	return (
		<LinkWithChannel
			href={`/admin/returns/${orderUuid}`}
			className="flex items-center gap-3 rounded-2xl bg-surface-base p-4 shadow-raised ring-1 ring-line-subtle transition-colors hover:ring-brand-primary sm:p-5"
		>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-base font-semibold text-content-primary">
						{t("orderNumber", { number: orderNumber })}
					</p>
					<ReturnStatusBadge status={status} />
				</div>
				<p className="truncate text-sm text-content-secondary">{customer}</p>
				{reason && <p className="mt-1 text-sm text-content-primary">{tReasons(reason)}</p>}
				{requestedLabel && (
					<p className="mt-1 text-xs text-content-secondary">
						{t("requestedAt")}: {requestedLabel}
					</p>
				)}
				{pickupLabel && (
					<p className="mt-1 text-xs font-medium text-content-primary">
						{t("pickupExpected")}: {pickupLabel}
					</p>
				)}
			</div>
			<ChevronRight className="h-5 w-5 shrink-0 text-content-secondary rtl:rotate-180" aria-hidden="true" />
		</LinkWithChannel>
	);
}
