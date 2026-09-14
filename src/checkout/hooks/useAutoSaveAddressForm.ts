/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { pick } from "lodash-es";
import { useCallback, useRef } from "react";
import { type AddressFormData, type OptionalAddress } from "@/checkout/components/AddressForm/types";
import { useAddressFormSchema } from "@/checkout/components/AddressForm/useAddressFormSchema";
import {
	getAddressFormDataFromAddress,
	isMatchingAddressFormData,
} from "@/checkout/components/AddressForm/utils";
import { type CountryCode } from "@/checkout/graphql";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import {
	type BlurHandler,
	type ChangeHandler,
	type FormHelpers,
	type FormProps,
	hasErrors,
	useForm,
	type UseFormReturn,
} from "@/checkout/hooks/useForm";
import { getCheckoutFromSubmitResult, useRegisterStepCommit } from "@/checkout/hooks/useStepCommit";
import {
	type CheckoutUpdateStateScope,
	useCheckoutUpdateStateChange,
} from "@/checkout/state/updateStateStore";

export type AutoSaveAddressFormData = Partial<AddressFormData>;

type SubmitFn = (
	formData: AutoSaveAddressFormData,
	formHelpers: FormHelpers<AutoSaveAddressFormData>,
) => Promise<unknown>;

export const useAutoSaveAddressForm = ({
	scope,
	savedAddress,
	commitOrder,
	commitEnabled = true,
	...formProps
}: FormProps<AutoSaveAddressFormData> & {
	scope: CheckoutUpdateStateScope;
	// The address as Saleor currently has it — lets commit() skip a write that
	// would change nothing.
	savedAddress: OptionalAddress;
	// Position in the commit-on-advance chain (STEP_COMMIT_ORDER).
	commitOrder: number;
	// false while the form isn't in use (e.g. billing hidden behind "same as
	// shipping"), so its empty values don't fail the step.
	commitEnabled?: boolean;
}): UseFormReturn<AutoSaveAddressFormData> & { handleSubmit: (event: any) => Promise<void> } => {
	const { setCheckoutUpdateState } = useCheckoutUpdateStateChange(scope);
	const { initialValues } = formProps;
	const onSubmit = formProps.onSubmit as SubmitFn;
	const { setCountryCode, validationSchema } = useAddressFormSchema(initialValues.countryCode);

	const form = useForm<AutoSaveAddressFormData>({ ...formProps, validationSchema });
	const { values, validateForm, handleBlur, handleChange, setTouched } = form;

	// Latest field values, updated synchronously inside change handlers. The
	// render-time `values` still hold the PREVIOUS keystroke while onChange runs
	// (formik applies the change on the next render), which used to make a
	// just-selected emirate fail validation and never trigger a save.
	const latestValuesRef = useRef(values);
	latestValuesRef.current = values;

	const debouncedSubmit = useDebouncedSubmit(onSubmit, {
		onPendingCancelledOnUnmount: () => setCheckoutUpdateState("success"),
	});

	const formHelpers = pick(form, [
		"setErrors",
		"setStatus",
		"setTouched",
		"setValues",
		"setSubmitting",
		"setFormikState",
		"setFieldValue",
		"setFieldTouched",
		"setFieldError",
		"validateForm",
		"validateField",
		"resetForm",
		"submitForm",
	]) as FormHelpers<AutoSaveAddressFormData>;

	const getSubmitData = useCallback(
		(formValues: AutoSaveAddressFormData) => ({
			...initialValues,
			countryCode: formValues.countryCode,
			...formValues,
		}),
		[initialValues],
	);

	// it'd make sense for onSubmit prop to be optional but formik has ignored this
	// request for forever now https://github.com/jaredpalmer/formik/issues/2675
	// so we're just gonna add a partial submit for guest address form to work
	const partialSubmit = useCallback(
		(nextValues: AutoSaveAddressFormData) => {
			const formErrors = validateForm(nextValues);
			const hasChanged = !isMatchingAddressFormData(nextValues, form.initialValues);

			if (!hasErrors(formErrors) && hasChanged) {
				setCheckoutUpdateState("loading");
				debouncedSubmit(getSubmitData(nextValues), formHelpers);
			}
		},
		[validateForm, form.initialValues, setCheckoutUpdateState, debouncedSubmit, getSubmitData, formHelpers],
	);

	const onChange: ChangeHandler = (event) => {
		const { name, value } = event.target as { name: string; value: string };

		if (name === "countryCode") {
			setCountryCode(value as CountryCode);
		}

		handleChange(event);
		latestValuesRef.current = { ...latestValuesRef.current, [name]: value };
		partialSubmit(latestValuesRef.current);
	};

	const onBlur: BlurHandler = (event) => {
		handleBlur(event);
		partialSubmit(latestValuesRef.current);
	};

	useRegisterStepCommit(commitOrder, async (context) => {
		if (!commitEnabled) {
			return true;
		}

		debouncedSubmit.cancel();
		const currentValues = latestValuesRef.current;
		const formErrors = validateForm(currentValues);

		if (hasErrors(formErrors)) {
			// Nothing is in flight any more — don't leave the scope at "loading".
			setCheckoutUpdateState("success");
			await setTouched(Object.keys(formErrors).reduce((touched, key) => ({ ...touched, [key]: true }), {}));
			return false;
		}

		if (
			savedAddress &&
			isMatchingAddressFormData(currentValues, getAddressFormDataFromAddress(savedAddress))
		) {
			setCheckoutUpdateState("success");
			return true;
		}

		const result = await onSubmit(getSubmitData(currentValues), formHelpers);
		const savedCheckout = getCheckoutFromSubmitResult(result);
		if (savedCheckout) {
			context.checkout = savedCheckout;
		}

		return !(result as { hasErrors?: boolean } | undefined)?.hasErrors;
	});

	return {
		...form,
		handleChange: onChange,
		handleBlur: onBlur,
		handleSubmit: () => {
			partialSubmit(latestValuesRef.current);
			return Promise.resolve();
		},
	};
};
