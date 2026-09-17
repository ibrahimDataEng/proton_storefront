import React, { useCallback, useEffect, useState } from "react";
import { PaymentMethods } from "./PaymentMethods";
import { PaymentSectionSkeleton } from "./PaymentSectionSkeleton";
import { Button } from "@/checkout/components/Button";
import { Divider } from "@/checkout/components/Divider";
import { Title } from "@/checkout/components/Title";
import {
	createReadinessDeadline,
	getReadinessMessage,
	getStepForProblems,
	useCheckoutReadiness,
} from "@/checkout/hooks/useCheckoutReadiness";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { getQueryParams } from "@/checkout/lib/utils/url";

type ReadinessGate =
	| { status: "checking" }
	| { status: "ready" }
	| { status: "blocked"; message: string; backTo: "contact" | "shipping" }
	| { status: "error"; message: string };

interface PaymentSectionProps {
	onNavigateBack?: (step: "contact" | "shipping") => void;
	// Deadline of the Continue click that opened this step (shared budget).
	readinessDeadline?: number;
}

export const PaymentSection = ({ onNavigateBack, readinessDeadline }: PaymentSectionProps) => {
	const { payment, readiness, wizard } = useCheckoutMessages();
	const { verify } = useCheckoutReadiness();

	// Returning from a payment redirect (Stripe's return_url carries
	// processingPayment=true): the money has already moved, and the only code
	// that reconciles it — transactionProcess, then checkoutComplete — lives
	// inside the gateway components below. Gating here would block exactly
	// that, and the checkout may legitimately already be an order by now
	// (Stripe's webhook safety net can complete it first), so a fresh fetch
	// would read null and flip the whole view to "not found" mid-reconciliation.
	// If that checkout turns out incomplete, checkoutComplete fails gracefully
	// (usePayments' retry guard) and "Back to Shipping" plus this same gate on
	// the next mount is the way through.
	const [isRedirectReturn] = useState(() => !!getQueryParams().processingPayment);
	const [gate, setGate] = useState<ReadinessGate>(
		isRedirectReturn ? { status: "ready" } : { status: "checking" },
	);

	const checkReadiness = useCallback(
		async (deadline: number) => {
			// The Continue click that got here already spent the whole budget: its
			// step check either just confirmed the checkout or already failed open
			// (and recorded that), so a second wait would only double the delay.
			if (Date.now() >= deadline) {
				setGate({ status: "ready" });
				return;
			}

			setGate({ status: "checking" });

			// No settle window: the Shipping forms are unmounted by now, so only
			// saves already in flight can still land — verify() waits for those.
			const result = await verify("payment", { deadline });

			switch (result.status) {
				case "cancelled":
					return;
				case "ready":
					setGate({ status: "ready" });
					return;
				case "notReady":
					setGate({
						status: "blocked",
						message: getReadinessMessage(result, readiness),
						backTo: getStepForProblems(result.problems),
					});
					return;
				case "checkoutGone":
					setGate({ status: "error", message: getReadinessMessage(result, readiness) });
					return;
				default:
					// "error": the check itself couldn't complete. Fail open, exactly as
					// goNext does — a broken check must not block every payment.
					setGate({ status: "ready" });
			}
		},
		[readiness, verify],
	);

	useEffect(() => {
		if (!isRedirectReturn) {
			void checkReadiness(readinessDeadline ?? createReadinessDeadline());
		}
		// Once per mount on purpose: after the gate opens it must never re-close
		// while a payment is being entered or confirmed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Divider />
			<div className="py-4" data-testid="paymentMethods">
				<Title>{payment.title}</Title>
				{gate.status === "checking" && <PaymentSectionSkeleton />}
				{gate.status === "ready" && <PaymentMethods />}
				{(gate.status === "blocked" || gate.status === "error") && (
					<div
						role="alert"
						data-testid="paymentNotReady"
						className="mt-4 rounded-xl border border-s-4 border-status-warning/30 border-s-status-warning bg-status-warning/5 p-4 shadow-sm"
					>
						<p className="font-semibold text-content-primary">{readiness.paymentNotReadyTitle}</p>
						<p className="mt-1 text-sm text-content-secondary">{gate.message}</p>
						<div className="mt-3 flex flex-wrap gap-3">
							{onNavigateBack && (
								<Button
									variant="primary"
									label={
										gate.status === "blocked" && gate.backTo === "contact"
											? wizard.backToContact
											: wizard.backToShipping
									}
									onClick={() => onNavigateBack(gate.status === "blocked" ? gate.backTo : "shipping")}
								/>
							)}
							{gate.status === "error" && (
								<Button
									variant="secondary"
									label={readiness.tryAgain}
									onClick={() => void checkReadiness(createReadinessDeadline())}
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
};
