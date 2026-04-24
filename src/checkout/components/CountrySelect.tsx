import React from "react";
import { Select } from "@/checkout/components/Select";
import { type CountryCode } from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { countries as allCountries } from "@/checkout/lib/consts/countries";
import { getCountryName } from "@/checkout/lib/utils/locale";

interface CountrySelectProps {
	only?: CountryCode[];
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ only = [] }) => {
	const { address } = useCheckoutMessages();
	const countriesToMap = only.length ? only : allCountries;

	const countryOptions = countriesToMap.map((countryCode) => ({
		value: countryCode,
		label: getCountryName(countryCode),
	}));

	return (
		<Select name="countryCode" label={address.country} options={countryOptions} autoComplete="countryCode" />
	);
};
