import { compact } from "lodash-es";
import { useCallback, useEffect, useRef } from "react";
import { type OptionalAddress } from "@/checkout/components/AddressForm/types";
import { getByMatchingAddress, isMatchingAddress } from "@/checkout/components/AddressForm/utils";
import { type AddressFragment } from "@/checkout/graphql";
import { useAddressAvailability } from "@/checkout/hooks/useAddressAvailability";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import { type FormHelpers, useForm } from "@/checkout/hooks/useForm";
import { type FormSubmitFn } from "@/checkout/hooks/useFormSubmit";
import { getCheckoutFromSubmitResult, useRegisterStepCommit } from "@/checkout/hooks/useStepCommit";
import { useUser } from "@/checkout/hooks/useUser";
import { getById, getByUnmatchingId } from "@/checkout/lib/utils/common";

export interface AddressListFormData {
	selectedAddressId: string | undefined;
	addressList: AddressFragment[];
}

interface UseAddressListProps {
	onSubmit: FormSubmitFn<AddressListFormData>;
	checkoutAddress: OptionalAddress;
	defaultAddress: OptionalAddress;
	checkAddressAvailability?: boolean;
	// Position in the commit-on-advance chain (STEP_COMMIT_ORDER).
	commitOrder: number;
	// Puts whatever "in progress" flag the caller raised back to idle when a
	// pending save is dropped or resolved by a commit.
	onSaveSettled?: () => void;
}

export const useAddressListForm = ({
	onSubmit,
	checkoutAddress,
	defaultAddress,
	checkAddressAvailability = false,
	commitOrder,
	onSaveSettled,
}: UseAddressListProps) => {
	const { user } = useUser();

	const { isAvailable } = useAddressAvailability(!checkAddressAvailability);

	// sdk has outdated types
	const addresses = (user?.addresses || []) as AddressFragment[];

	const previousCheckoutAddress = useRef<OptionalAddress>(null);

	const form = useForm<AddressListFormData>({
		initialDirty: true,
		initialValues: {
			addressList: addresses,
			selectedAddressId: addresses.find(getByMatchingAddress(checkoutAddress))?.id,
		},
		onSubmit,
	});

	const { values, setValues, setFieldValue, handleSubmit } = form;

	const debouncedSubmit = useDebouncedSubmit(handleSubmit, { onPendingCancelledOnUnmount: onSaveSettled });

	const latestValues = useRef(values);
	latestValues.current = values;

	// Commit-on-advance: save the currently selected address immediately.
	// onSubmit's own shouldAbort skips it when nothing is selected or it already
	// matches the checkout; a missing address is left for the readiness check.
	useRegisterStepCommit(commitOrder, async (context) => {
		debouncedSubmit.cancel();

		const { selectedAddressId: currentSelection } = latestValues.current;
		if (!currentSelection) {
			onSaveSettled?.();
			return true;
		}

		const result = await onSubmit(latestValues.current, form as unknown as FormHelpers<AddressListFormData>);
		const savedCheckout = getCheckoutFromSubmitResult(result);
		if (savedCheckout) {
			context.checkout = savedCheckout;
		}
		onSaveSettled?.();
		return !result.hasErrors;
	});

	const { addressList, selectedAddressId } = values;
	const selectedAddress = addressList.find(getById(selectedAddressId));

	useEffect(() => {
		debouncedSubmit();
	}, [debouncedSubmit, selectedAddressId]);

	const addressListUpdate = async (selectedAddress: OptionalAddress, addressList: AddressFragment[]) => {
		if (!selectedAddress) {
			return;
		}

		setValues({
			addressList,
			selectedAddressId: selectedAddress.id,
		});

		handleSubmit();
	};

	const onAddressCreateSuccess = async (address: OptionalAddress) =>
		addressListUpdate(address, compact([...addressList, address]));

	const onAddressUpdateSuccess = async (address: OptionalAddress) =>
		addressListUpdate(
			address,
			addressList.map((existingAddress) => (existingAddress.id === address?.id ? address : existingAddress)),
		);

	const onAddressDeleteSuccess = (id: string) =>
		addressListUpdate(addressList[0], addressList.filter(getByUnmatchingId(id)));

	const handleDefaultAddressSet = useCallback(async () => {
		const isSelectedAddressSameAsCheckout =
			!!selectedAddress && isMatchingAddress(checkoutAddress, selectedAddress);

		const hasCheckoutAddressChanged = !isMatchingAddress(checkoutAddress, previousCheckoutAddress.current);

		// currently selected address is the same as checkout or
		// address hasn't changed at all -> do nothing
		if (isSelectedAddressSameAsCheckout || (checkoutAddress && !hasCheckoutAddressChanged)) {
			return;
		}

		const matchingDefaultAddressInAddresses = addressList.find(getByMatchingAddress(defaultAddress));
		// if not, prefer user default address
		if (defaultAddress && matchingDefaultAddressInAddresses) {
			previousCheckoutAddress.current = defaultAddress;
			void setFieldValue("selectedAddressId", matchingDefaultAddressInAddresses.id);
			return;
		}

		const firstAvailableAddress = addressList.find(isAvailable);

		// otherwise just choose any available
		if (firstAvailableAddress) {
			previousCheckoutAddress.current = firstAvailableAddress;
			void setFieldValue("selectedAddressId", firstAvailableAddress.id);
		}

		// otherwise it gets way overcomplicated to get this to run only when needed
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultAddress?.id, checkoutAddress?.id]);

	useEffect(() => {
		void handleDefaultAddressSet();
	}, [handleDefaultAddressSet]);

	return {
		form,
		userAddressActions: {
			onAddressCreateSuccess,
			onAddressUpdateSuccess,
			onAddressDeleteSuccess,
		},
	};
};
