import { type CheckoutLineFragment } from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { SummaryItemMoneyInfo } from "@/checkout/sections/Summary/SummaryItemMoneyInfo";

interface SummaryItemMoneyLockedSectionProps {
	line: CheckoutLineFragment;
}

// Read-only checkout line for the Payment step (front_store-zxf). The Stripe
// PaymentIntent is created for Saleor's total when the Payment step mounts and
// is never re-created, so nothing on that step may change the total.
// SummaryItemMoneySection can't be reused: it's typed for order lines and reads
// undiscountedUnitPrice.gross, which checkout lines don't have.
export const SummaryItemMoneyLockedSection: React.FC<SummaryItemMoneyLockedSectionProps> = ({ line }) => {
	const { summary } = useCheckoutMessages();

	return (
		<div className="flex flex-col items-end gap-2" data-testid="summaryItemLocked">
			<p className="text-sm">
				{summary.quantity}: {line.quantity}
			</p>
			<SummaryItemMoneyInfo {...line} />
		</div>
	);
};
