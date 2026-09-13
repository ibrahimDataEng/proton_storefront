import { useMemo } from "react";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useEvent } from "@/checkout/hooks/useEvent";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { replaceUrl } from "@/checkout/lib/utils/url";

export const useCheckoutComplete = () => {
	// `checkout` can genuinely be null here even mid-flow, not just before
	// the initial load: Stripe's async webhook safety net can finish
	// converting this checkout into an Order (so `checkout(id:)` starts
	// returning null) before the browser's own confirmPayment() ->
	// transactionProcess -> onCheckoutComplete() chain gets back around to a
	// render. useCheckout()'s `as Checkout` cast hides this from the type
	// system, but not from the runtime — see front_store-4f0.
	const { checkout } = useCheckout();
	const checkoutId = checkout?.id;
	const [{ fetching }, checkoutComplete] = useCheckoutCompleteMutation();
	const { showCustomErrors } = useAlerts();
	const { payment } = useCheckoutMessages();

	const submit = useSubmit<{}, typeof checkoutComplete>(
		useMemo(
			() => ({
				parse: () => ({
					checkoutId,
				}),
				onSubmit: checkoutComplete,
				onSuccess: ({ data }) => {
					const order = data.order;

					if (order) {
						const newUrl = replaceUrl({
							query: {
								order: order.id,
							},
							replaceWholeQuery: true,
						});
						window.location.href = newUrl;
					}
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);

	// The guard must run BEFORE submit() is invoked, not inside it —
	// useSubmit()'s own handleSubmit reads checkout.id/checkout.channel.slug
	// unconditionally too, so calling it with a null checkout would throw
	// the identical crash one level down instead of failing gracefully here.
	const onCheckoutComplete = useEvent(() => {
		if (!checkoutId) {
			showCustomErrors([{ message: payment.unexpectedError }]);
			return Promise.resolve({ hasErrors: true, apiErrors: [], customErrors: [], graphqlErrors: [] });
		}

		return submit();
	});

	return { completingCheckout: fetching, onCheckoutComplete };
};
