import { useCallback, useEffect, useMemo, useRef } from "react";
import {
	type CheckoutFragment,
	type CountryCode,
	useCheckoutDeliveryMethodUpdateMutation,
} from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import { type ChangeHandler, type FormHelpers, useForm, type UseFormReturn } from "@/checkout/hooks/useForm";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { STEP_COMMIT_ORDER, useRegisterStepCommit } from "@/checkout/hooks/useStepCommit";
import { getCheckoutLanguageCode, useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { getById } from "@/checkout/lib/utils/common";
import { useCheckoutUpdateStateChange } from "@/checkout/state/updateStateStore";

interface DeliveryMethodsFormData {
	selectedMethodId: string | undefined;
}

type ShippingMethod = CheckoutFragment["shippingMethods"][number];

const getCheapestMethod = (shippingMethods: ShippingMethod[]) =>
	shippingMethods.length
		? shippingMethods.reduce(
				(resultMethod, currentMethod) =>
					currentMethod.price.amount < resultMethod.price.amount ? currentMethod : resultMethod,
				shippingMethods[0],
			)
		: undefined;

export const useDeliveryMethodsForm = (): UseFormReturn<DeliveryMethodsFormData> => {
	const { checkout } = useCheckout();
	const { shippingMethods, shippingAddress, deliveryMethod } = checkout;
	const [, updateDeliveryMethod] = useCheckoutDeliveryMethodUpdateMutation();
	const { setCheckoutUpdateState } = useCheckoutUpdateStateChange("checkoutDeliveryMethodUpdate");
	const { locale } = useCheckoutMessages();

	const previousShippingCountry = useRef<MightNotExist<CountryCode>>(
		shippingAddress?.country?.code as CountryCode | undefined,
	);

	const getAutoSetMethod = useCallback(() => getCheapestMethod(shippingMethods), [shippingMethods]);

	const defaultFormData: DeliveryMethodsFormData = {
		selectedMethodId: deliveryMethod?.id || getAutoSetMethod()?.id,
	};

	const onSubmit = useFormSubmit<DeliveryMethodsFormData, typeof updateDeliveryMethod>(
		useMemo(
			() => ({
				scope: "checkoutDeliveryMethodUpdate",
				onSubmit: updateDeliveryMethod,
				shouldAbort: ({ formData: { selectedMethodId } }) =>
					!selectedMethodId || selectedMethodId === checkout.deliveryMethod?.id,
				// Reset the scope to idle when the submit is skipped (onChange set it
				// to "loading" before debouncing).
				onAbort: () => {},
				parse: ({ selectedMethodId, languageCode, checkoutId }) => ({
					deliveryMethodId: selectedMethodId as string,
					languageCode,
					checkoutId,
				}),
				onError: ({ formData: { selectedMethodId }, formHelpers: { setValues } }) => {
					return setValues({ selectedMethodId });
				},
			}),
			[checkout.deliveryMethod?.id, updateDeliveryMethod],
		),
	);

	const debouncedSubmit = useDebouncedSubmit(onSubmit, {
		onPendingCancelledOnUnmount: () => setCheckoutUpdateState("success"),
	});

	const form = useForm<DeliveryMethodsFormData>({
		initialValues: defaultFormData,
		onSubmit: (data: DeliveryMethodsFormData, helpers: FormHelpers<DeliveryMethodsFormData>) => {
			debouncedSubmit(data, helpers);
			return Promise.resolve();
		},
		initialDirty: true,
	});

	const {
		setFieldValue,
		values: { selectedMethodId },
		handleSubmit,
		handleChange,
	} = form;

	const latestSelectedMethodId = useRef(selectedMethodId);
	latestSelectedMethodId.current = selectedMethodId;

	useEffect(() => {
		handleSubmit();
	}, [handleSubmit, selectedMethodId]);

	useEffect(() => {
		const hasShippingCountryChanged = shippingAddress?.country?.code !== previousShippingCountry.current;

		const hasValidMethodSelected = selectedMethodId && shippingMethods.some(getById(selectedMethodId));

		if (hasValidMethodSelected) {
			return;
		}

		void setFieldValue("selectedMethodId", getAutoSetMethod()?.id);

		if (hasShippingCountryChanged) {
			previousShippingCountry.current = shippingAddress?.country?.code as CountryCode;
		}
	}, [
		shippingAddress,
		shippingMethods,
		getAutoSetMethod,
		selectedMethodId,
		setFieldValue,
		form.values.selectedMethodId,
	]);

	// Commit-on-advance. Shipping methods only exist once the shipping address
	// is saved, so this reads context.checkout (updated by the shipping-address
	// commit earlier in the same run) rather than this render's checkout.
	useRegisterStepCommit(STEP_COMMIT_ORDER.deliveryMethod, async (context) => {
		const latestCheckout: Pick<
			CheckoutFragment,
			"id" | "isShippingRequired" | "shippingMethods" | "deliveryMethod"
		> = context.checkout ?? checkout;

		if (!latestCheckout.isShippingRequired) {
			return true;
		}

		debouncedSubmit.cancel();

		const methods = latestCheckout.shippingMethods;
		const currentSelection = latestSelectedMethodId.current;
		const methodToSave =
			currentSelection && methods.some(getById(currentSelection))
				? currentSelection
				: getCheapestMethod(methods)?.id;

		if (!methodToSave) {
			// No methods to choose from yet (no saved address) — the readiness
			// check reports what's actually missing.
			setCheckoutUpdateState("success");
			return true;
		}

		if (methodToSave !== currentSelection) {
			void setFieldValue("selectedMethodId", methodToSave);
		}

		if (methodToSave === latestCheckout.deliveryMethod?.id) {
			setCheckoutUpdateState("success");
			return true;
		}

		setCheckoutUpdateState("loading");
		const result = await updateDeliveryMethod({
			checkoutId: latestCheckout.id,
			deliveryMethodId: methodToSave,
			languageCode: getCheckoutLanguageCode(locale),
		});
		const payload = result.data?.checkoutDeliveryMethodUpdate;
		const failed = !!result.error || !!payload?.errors?.length;

		setCheckoutUpdateState(failed ? "error" : "success");
		if (payload?.checkout) {
			context.checkout = payload.checkout as CheckoutFragment;
		}

		return !failed;
	});

	const onChange: ChangeHandler = (event) => {
		setCheckoutUpdateState("loading");
		handleChange(event);
	};

	return { ...form, handleChange: onChange };
};
