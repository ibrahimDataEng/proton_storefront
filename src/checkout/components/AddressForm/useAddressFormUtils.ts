import camelCase from "lodash-es/camelCase";
import { useCallback, useMemo } from "react";
import {
	type CountryCode,
	useAddressValidationRulesQuery,
	type ValidationRulesFragment,
} from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";
import { type OptionalAddress, type AddressField } from "@/checkout/components/AddressForm/types";
import { defaultCountry } from "@/checkout/lib/consts/countries";
import { getOrderedAddressFields, getRequiredAddressFields } from "@/checkout/components/AddressForm/utils";

export type AddressFieldLabel = Exclude<AddressField, "countryCode"> | "country";
export type LocalizedAddressFieldLabel =
	| "province"
	| "district"
	| "state"
	| "zip"
	| "postal"
	| "postTown"
	| "prefecture";

export const useAddressFormUtils = (countryCode: CountryCode = defaultCountry) => {
	const { address } = useCheckoutMessages();
	const [{ data }] = useAddressValidationRulesQuery({
		variables: { countryCode },
	});

	const validationRules = data?.addressValidationRules as ValidationRulesFragment;

	const { countryAreaType, postalCodeType, cityType } = validationRules || {};

	const localizedFields = useMemo(
		() => ({
			countryArea: countryAreaType,
			city: cityType,
			postalCode: postalCodeType,
		}),
		[cityType, countryAreaType, postalCodeType],
	);

	const isRequiredField = useCallback(
		(field: AddressField) =>
			getRequiredAddressFields(validationRules?.requiredFields as AddressField[]).includes(field),
		[validationRules?.requiredFields],
	);

	const getMissingFieldsFromAddress = useCallback(
		(address: OptionalAddress) => {
			if (!address) {
				return [];
			}

			return Object.entries(address).reduce((result, [fieldName, fieldValue]) => {
				if (!isRequiredField(fieldName as AddressField)) {
					return result;
				}

				return !!fieldValue ? result : ([...result, fieldName] as AddressField[]);
			}, [] as AddressField[]);
		},
		[isRequiredField],
	);

	const hasAllRequiredFields = useCallback(
		(address: OptionalAddress) => !getMissingFieldsFromAddress(address).length,
		[getMissingFieldsFromAddress],
	);

	const getLocalizedFieldLabel = useCallback(
		(field: AddressField, localizedField?: string) => {
			const localizedAddressFieldMessages: Record<LocalizedAddressFieldLabel, string> = {
				province: address.province,
				district: address.district,
				state: address.state,
				zip: address.zip,
				postal: address.postal,
				postTown: address.postTown,
				prefecture: address.prefecture,
			};
			const addressFieldMessages: Record<AddressFieldLabel, string> = {
				city: address.city,
				firstName: address.firstName,
				countryArea: address.countryArea,
				lastName: address.lastName,
				country: address.country,
				cityArea: address.cityArea,
				postalCode: address.postalCode,
				companyName: address.companyName,
				streetAddress1: address.streetAddress1,
				streetAddress2: address.streetAddress2,
				phone: address.phone,
			};
			try {
				const translatedLabel =
					localizedAddressFieldMessages[camelCase(localizedField) as LocalizedAddressFieldLabel];
				return translatedLabel;
			} catch (e) {
				console.warn(`Missing translation: ${localizedField}`);
				return addressFieldMessages[camelCase(field) as AddressFieldLabel];
			}
		},
		[address],
	);

	const getFieldLabel = useCallback(
		(field: AddressField) => {
			const addressFieldMessages: Record<AddressFieldLabel, string> = {
				city: address.city,
				firstName: address.firstName,
				countryArea: address.countryArea,
				lastName: address.lastName,
				country: address.country,
				cityArea: address.cityArea,
				postalCode: address.postalCode,
				companyName: address.companyName,
				streetAddress1: address.streetAddress1,
				streetAddress2: address.streetAddress2,
				phone: address.phone,
			};
			const localizedField = localizedFields[field as keyof typeof localizedFields];

			const isLocalizedField = !!localizedField && localizedField !== field;

			if (isLocalizedField) {
				return getLocalizedFieldLabel(
					field,
					localizedFields[field as keyof typeof localizedFields] as LocalizedAddressFieldLabel,
				);
			}

			return addressFieldMessages[field as AddressFieldLabel];
		},
		[address, getLocalizedFieldLabel, localizedFields],
	);

	const orderedAddressFields = getOrderedAddressFields(validationRules?.allowedFields as AddressField[]);

	return {
		orderedAddressFields,
		getFieldLabel,
		isRequiredField,
		hasAllRequiredFields,
		getMissingFieldsFromAddress,
		...validationRules,
		allowedFields: validationRules?.allowedFields as AddressField[] | undefined,
	};
};
