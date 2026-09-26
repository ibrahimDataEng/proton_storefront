import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { type ReturnStatus } from "@/lib/returns/returnCodes";

const STATUS_CLASSES: Record<ReturnStatus, string> = {
	requested: "bg-status-warning/10 text-status-warning",
	pickup_scheduled: "bg-status-warning/10 text-status-warning",
	rejected: "bg-status-danger/10 text-status-danger",
	item_received: "bg-status-success/10 text-status-success",
	refunded: "bg-status-success/10 text-status-success",
};

/** Shared by the account order list and the admin review page (works in server and client components). */
export function ReturnStatusBadge({ status, className }: { status: ReturnStatus; className?: string }) {
	const t = useTranslations("account.returnRequest.status");
	return (
		<span
			className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_CLASSES[status], className)}
		>
			{t(status)}
		</span>
	);
}
