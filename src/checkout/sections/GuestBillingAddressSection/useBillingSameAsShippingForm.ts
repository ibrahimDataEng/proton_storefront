/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useCallback, useEffect, useRef, useState } from "react";
import { type OptionalAddress } from "@/checkout/components/AddressForm/types";
import {
	getAddressInputDataFromAddress,
	getAddressValidationRulesVariables,
	getEmptyAddress,
	isMatchingAddress,
	isMatchingAddressData,
} from "@/checkout/components/AddressForm/utils";
import {
	type AddressFragment,
	type CheckoutFragment,
	useCheckoutBillingAddressUpdateMutation,
} from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { type ChangeHandler, useForm } from "@/checkout/hooks/useForm";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { STEP_COMMIT_ORDER, useRegisterStepCommit } from "@/checkout/hooks/useStepCommit";
import { getCheckoutLanguageCode, useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import {
	useCheckoutUpdateState,
	useCheckoutUpdateStateActions,
	useCheckoutUpdateStateChange,
} from "@/checkout/state/updateStateStore";

interface BillingSameAsShippingFormData {
	billingSameAsShipping: boolean;
	billingAddress: OptionalAddress;
}

interface BillingSameAsShippingFormProps {
	autoSave: boolean;
	onSetBillingSameAsShipping?: (address: OptionalAddress) => void;
}

export const useBillingSameAsShippingForm = (
	{ autoSave, onSetBillingSameAsShipping }: BillingSameAsShippingFormProps = { autoSave: false },
) => {
	const { checkout } = useCheckout();
	const { billingAddress, shippingAddress, isShippingRequired } = checkout;
	const previousShippingAddress = useRef<OptionalAddress>(shippingAddress);
	const previousIsShippingRequired = useRef(isShippingRequired);
	const { setChangingBillingCountry } = useCheckoutUpdateStateActions();
	const [formBillingAddress, setFormBillingAddress] =
		useState<MightNotExist<AddressFragment>>(billingAddress);

	const [, checkoutBillingAddressUpdate] = useCheckoutBillingAddressUpdateMutation();
	const { setCheckoutUpdateState: setBillingUpdateState } =
		useCheckoutUpdateStateChange("checkoutBillingUpdate");
	const { locale } = useCheckoutMessages();

	const onSubmit = useFormSubmit<BillingSameAsShippingFormData, typeof checkoutBillingAddressUpdate>({
		scope: "checkoutBillingUpdate",
		onSubmit: checkoutBillingAddressUpdate,
		shouldAbort: () => !formBillingAddress || !Object.keys(formBillingAddress).length,
		onStart: () => {
			if (formBillingAddress?.country.code !== billingAddress?.country.code) {
				setChangingBillingCountry(true);
			}
		},
		parse: ({ languageCode, checkoutId }) => ({
			languageCode,
			checkoutId,
			billingAddress: getAddressInputDataFromAddress(formBillingAddress),
			validationRules: getAddressValidationRulesVariables({ autoSave }),
		}),
		onSuccess: ({ data }) => {
			setFormBillingAddress(data.checkout?.billingAddress);
		},
		onFinished: () => {
			setChangingBillingCountry(false);
		},
	});

	const getInitialShippingAsBillingValue = useCallback(() => {
		if (!checkout.isShippingRequired) {
			return false;
		}

		return !billingAddress || isMatchingAddress(shippingAddress, billingAddress);
	}, [shippingAddress, billingAddress, checkout.isShippingRequired]);

	const initialValues = {
		billingSameAsShipping: getInitialShippingAsBillingValue(),
		billingAddress: billingAddress,
	};

	const previousBillingSameAsShipping = useRef(initialValues.billingSameAsShipping);

	const form = useForm<BillingSameAsShippingFormData>({
		onSubmit,
		initialValues,
		initialDirty: true,
	});

	const {
		values: { billingSameAsShipping },
		setFieldValue,
		handleSubmit,
		handleChange,
	} = form;

	const onChange: ChangeHandler = (event) => {
		if (event.target.name === "billingSameAsShipping") {
			previousBillingSameAsShipping.current = billingSameAsShipping;
		}
		handleChange(event);
	};

	// handle "billing same as shipping" checkbox value changes
	useEffect(() => {
		const handleBillingSameAsShippingChanged = async () => {
			const hasBillingSameAsShippingChangedToTrue =
				billingSameAsShipping && !previousBillingSameAsShipping.current;

			const hasBillingSameAsShippingChangedToFalse =
				!billingSameAsShipping && previousBillingSameAsShipping.current;

			if (hasBillingSameAsShippingChangedToFalse) {
				previousBillingSameAsShipping.current = false;

				// autosave means it's geust form and we want to show empty form
				// and clear all the fields in api
				if (autoSave) {
					setFormBillingAddress(getEmptyAddress());
				}
				return;
			}

			if (!hasBillingSameAsShippingChangedToTrue) {
				return;
			}

			previousBillingSameAsShipping.current = true;
			setFormBillingAddress(shippingAddress);
			if (typeof onSetBillingSameAsShipping === "function") {
				onSetBillingSameAsShipping(shippingAddress);
			}
		};

		void handleBillingSameAsShippingChanged();
	}, [
		autoSave,
		billingSameAsShipping,
		handleSubmit,
		onSetBillingSameAsShipping,
		setFieldValue,
		shippingAddress,
	]);

	// once billing address in api and form don't match, submit — but not while a
	// billing save or a checkout refetch is still in flight: during that window
	// the rendered `billingAddress` lags behind what was just sent, so the
	// mismatch is stale and re-submitting only re-sends the same address (a
	// rushed Shipping step produced 7 identical billing writes in 3s).
	const { updateState, loadingCheckout } = useCheckoutUpdateState();
	const billingSaveInFlight = updateState.checkoutBillingUpdate === "loading";

	useEffect(() => {
		if (billingSaveInFlight || loadingCheckout) {
			return;
		}

		if (formBillingAddress && !isMatchingAddress(billingAddress, formBillingAddress)) {
			handleSubmit();
		}
	}, [
		billingAddress,
		billingSameAsShipping,
		billingSaveInFlight,
		formBillingAddress,
		handleSubmit,
		loadingCheckout,
		shippingAddress,
	]);

	// when shipping address changes in the api, set it as billing address
	useEffect(() => {
		const handleShippingAddressChanged = async () => {
			const hasShippingAddressChanged = !isMatchingAddressData(
				shippingAddress,
				previousShippingAddress.current,
			);

			if (!hasShippingAddressChanged) {
				return;
			}

			previousShippingAddress.current = shippingAddress;

			if (billingSameAsShipping) {
				setFormBillingAddress(shippingAddress);
			}
		};

		void handleShippingAddressChanged();
	}, [billingSameAsShipping, handleSubmit, shippingAddress]);

	useEffect(() => {
		if (!isShippingRequired && previousIsShippingRequired) {
			void setFieldValue("billingSameAsShipping", false);
		}
	}, [isShippingRequired, setFieldValue]);

	// Commit-on-advance: with "same as shipping" checked, billing must equal the
	// shipping address Saleor has *now* — including one saved moments ago by
	// the shipping commit in this same run (context.checkout), which this
	// render's `shippingAddress` doesn't reflect yet.
	useRegisterStepCommit(STEP_COMMIT_ORDER.billingSameAsShipping, async (context) => {
		if (!isShippingRequired || !billingSameAsShipping) {
			return true;
		}

		const latestCheckout: Pick<CheckoutFragment, "shippingAddress" | "billingAddress"> =
			context.checkout ?? checkout;
		const target = latestCheckout.shippingAddress;

		// Nothing to mirror yet; the readiness check reports the missing address.
		if (!target || isMatchingAddressData(latestCheckout.billingAddress, target)) {
			return true;
		}

		// Align the form state first so the auto-submit effect above can't
		// re-send an older address once this lands.
		setFormBillingAddress(target);
		setBillingUpdateState("loading");

		const result = await checkoutBillingAddressUpdate({
			checkoutId: checkout.id,
			languageCode: getCheckoutLanguageCode(locale),
			billingAddress: getAddressInputDataFromAddress(target),
			validationRules: getAddressValidationRulesVariables({ autoSave }),
		});
		const payload = result.data?.checkoutBillingAddressUpdate;
		const failed = !!result.error || !!payload?.errors?.length;

		setBillingUpdateState(failed ? "error" : "success");
		if (payload?.checkout) {
			context.checkout = payload.checkout as CheckoutFragment;
		}

		return !failed;
	});

	return {
		...form,
		handleChange: onChange,
	};
};
