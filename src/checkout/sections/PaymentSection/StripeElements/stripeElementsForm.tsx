import { type FormEventHandler, useEffect, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { type StripePaymentElementOptions } from "@stripe/stripe-js";
import { getUrlForTransactionInitialize } from "../utils";
import { useTransactionProcessMutation } from "@/checkout/graphql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useCheckoutComplete } from "@/checkout/hooks/useCheckoutComplete";
import { useEvent } from "@/checkout/hooks/useEvent";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { clearQueryParams, getQueryParams } from "@/checkout/lib/utils/url";
import { usePaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";
import {
	anyFormsValidating,
	areAllFormsValid,
	useCheckoutValidationActions,
	useCheckoutValidationState,
} from "@/checkout/state/checkoutValidationStateStore";
import {
	areAnyRequestsInProgress,
	hasFinishedApiChangesWithNoError,
	useCheckoutUpdateState,
	useCheckoutUpdateStateActions,
} from "@/checkout/state/updateStateStore";
import { useUser } from "@/checkout/hooks/useUser";

const paymentElementOptions: StripePaymentElementOptions = {
	layout: "tabs",
	fields: {
		billingDetails: "never",
	},
};

export function CheckoutForm() {
	const { payment } = useCheckoutMessages();
	const [isLoading, setIsLoading] = useState(false);
	const stripe = useStripe();
	const elements = useElements();
	const { checkout } = useCheckout();
	const { authenticated } = useUser();
	const { showCustomErrors } = useAlerts();
	const checkoutUpdateState = useCheckoutUpdateState();
	const anyRequestsInProgress = areAnyRequestsInProgress(checkoutUpdateState);
	const finishedApiChangesWithNoError = hasFinishedApiChangesWithNoError(checkoutUpdateState);
	const { setSubmitInProgress, setShouldRegisterUser } = useCheckoutUpdateStateActions();
	const { validateAllForms } = useCheckoutValidationActions();
	const { validationState } = useCheckoutValidationState();
	const { setIsProcessingPayment } = usePaymentProcessingScreen();
	const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();
	const [, transactionProcess] = useTransactionProcessMutation();

	// Reconciles Stripe's confirmed PaymentIntent status back into Saleor's
	// own transaction state (transactionProcess) — the step the previous
	// version of this code skipped entirely, which left Saleor unaware
	// payment succeeded even though Stripe had already processed it. Only a
	// genuine CHARGE_SUCCESS/AUTHORIZATION_SUCCESS result completes the
	// checkout; anything else surfaces as an error instead.
	const handleTransactionProcess = useEvent(async (transactionId: string) => {
		const result = await transactionProcess({ id: transactionId }).catch((err) => {
			console.error(err);
			return null;
		});

		clearQueryParams("transaction");

		const processResult = result?.data?.transactionProcess;

		if (!processResult || processResult.errors.length > 0) {
			setIsProcessingPayment(false);
			showCustomErrors([{ message: payment.unexpectedError }]);
			return;
		}

		const eventType = processResult.transactionEvent?.type;
		const isSuccess = eventType === "CHARGE_SUCCESS" || eventType === "AUTHORIZATION_SUCCESS";

		if (!isSuccess) {
			setIsProcessingPayment(false);
			showCustomErrors([
				{ message: processResult.transactionEvent?.message || payment.paymentProcessingError },
			]);
			return;
		}

		return onCheckoutComplete();
	});

	const onSubmitInitialize: FormEventHandler<HTMLFormElement> = useEvent(async (e) => {
		e.preventDefault();
		setIsLoading(true);
		validateAllForms(authenticated);
		setShouldRegisterUser(true);
		setSubmitInProgress(true);
	});

	useEffect(() => {
		const { paymentIntent, paymentIntentClientSecret, processingPayment, transaction } = getQueryParams();

		if (!paymentIntent || !paymentIntentClientSecret || !processingPayment) {
			return;
		}

		if (completingCheckout) {
			return;
		}

		if (typeof transaction !== "string" || !transaction) {
			setIsProcessingPayment(false);
			showCustomErrors([{ message: payment.unexpectedError }]);
			return;
		}

		void handleTransactionProcess(transaction);
	}, [
		completingCheckout,
		handleTransactionProcess,
		payment.unexpectedError,
		setIsProcessingPayment,
		showCustomErrors,
	]);

	useEffect(() => {
		const validating = anyFormsValidating(validationState);
		const allFormsValid = areAllFormsValid(validationState);

		if (!checkoutUpdateState.submitInProgress || validating || anyRequestsInProgress) {
			return;
		}
		if (!stripe || !elements) {
			return;
		}

		setSubmitInProgress(false);

		if (!finishedApiChangesWithNoError || !allFormsValid) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);

		stripe
			.confirmPayment({
				elements,
				confirmParams: {
					return_url: getUrlForTransactionInitialize().newUrl,
					payment_method_data: {
						billing_details: {
							name: checkout.billingAddress?.firstName + " " + checkout.billingAddress?.lastName,
							email: checkout.email ?? "",
							phone: checkout.billingAddress?.phone ?? "",
							address: {
								city: checkout.billingAddress?.city ?? "",
								country: checkout.billingAddress?.country.code ?? "",
								line1: checkout.billingAddress?.streetAddress1 ?? "",
								line2: checkout.billingAddress?.streetAddress2 ?? "",
								postal_code: checkout.billingAddress?.postalCode ?? "",
								state: checkout.billingAddress?.countryArea ?? "",
							},
						},
					},
				},
			})
			.then(async ({ error }) => {
				console.error(error);
				setIsLoading(false);

				if (error) {
					setIsProcessingPayment(false);
					if (error.type === "card_error" || error.type === "validation_error") {
						showCustomErrors([{ message: error.message ?? payment.paymentProcessingError }]);
					} else {
						showCustomErrors([{ message: payment.unexpectedError }]);
					}
					return;
				}

				// Stripe confirmed the PaymentIntent without a redirect (e.g. no
				// 3DS challenge needed) — reconcile with Saleor via
				// transactionProcess before completing, same as the
				// redirect-return path above does.
				const { transaction } = getQueryParams();

				if (typeof transaction !== "string" || !transaction) {
					setIsProcessingPayment(false);
					showCustomErrors([{ message: payment.unexpectedError }]);
					return;
				}

				return handleTransactionProcess(transaction);
			})
			.catch((err) => {
				console.error(err);
				setIsLoading(false);
				setIsProcessingPayment(false);
			});
	}, [
		anyRequestsInProgress,
		checkout.billingAddress?.city,
		checkout.billingAddress?.country.code,
		checkout.billingAddress?.countryArea,
		checkout.billingAddress?.firstName,
		checkout.billingAddress?.lastName,
		checkout.billingAddress?.phone,
		checkout.billingAddress?.postalCode,
		checkout.billingAddress?.streetAddress1,
		checkout.billingAddress?.streetAddress2,
		checkout.email,
		checkoutUpdateState.submitInProgress,
		elements,
		finishedApiChangesWithNoError,
		handleTransactionProcess,
		payment.paymentProcessingError,
		payment.unexpectedError,
		setIsProcessingPayment,
		setSubmitInProgress,
		showCustomErrors,
		stripe,
		validationState,
	]);

	return (
		<form className="my-8 flex flex-col gap-y-6" onSubmit={onSubmitInitialize}>
			<PaymentElement className="payment-element" options={paymentElementOptions} />
			<button
				className="h-12 items-center rounded-md bg-neutral-900 px-6 py-3 text-base font-medium leading-6 text-white shadow hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70 hover:disabled:bg-neutral-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 hover:aria-disabled:bg-neutral-700"
				aria-disabled={isLoading || !stripe || !elements}
				id="submit"
			>
				<span className="button-text">{isLoading ? <Loader /> : payment.payNow}</span>
			</button>
		</form>
	);
}

function Loader() {
	const { payment } = useCheckoutMessages();

	return (
		<div className="text-center" aria-busy="true" role="status">
			<div>
				<svg
					aria-hidden="true"
					className="mr-2 inline h-6 w-6 animate-spin fill-neutral-600 text-neutral-100 dark:text-neutral-600"
					viewBox="0 0 100 101"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
						fill="currentColor"
					/>
					<path
						d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
						fill="currentFill"
					/>
				</svg>
				<span className="sr-only">{payment.processingPayment}</span>
			</div>
		</div>
	);
}
