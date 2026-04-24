import React from "react";
import { AddressForm } from "@/checkout/components/AddressForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useAvailableShippingCountries } from "@/checkout/hooks/useAvailableShippingCountries";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { useGuestShippingAddressForm } from "@/checkout/sections/GuestShippingAddressSection/useGuestShippingAddressForm";

export const GuestShippingAddressSection = () => {
	const { address } = useCheckoutMessages();
	const { availableShippingCountries } = useAvailableShippingCountries();

	const form = useGuestShippingAddressForm();

	const { handleChange, handleBlur } = form;

	return (
		<FormProvider form={form}>
			<AddressForm
				title={address.shippingAddress}
				availableCountries={availableShippingCountries}
				fieldProps={{
					onChange: handleChange,
					onBlur: handleBlur,
				}}
			/>
		</FormProvider>
	);
};
