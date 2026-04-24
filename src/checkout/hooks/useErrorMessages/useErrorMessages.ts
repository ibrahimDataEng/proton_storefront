import { useCallback, useMemo } from "react";
import { type ErrorCode } from "@/checkout/lib/globalTypes";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

export type ErrorMessages = Record<ErrorCode, string>;

export const useErrorMessages = <TKey extends string = ErrorCode>(customMessages?: Record<TKey, string>) => {
	const { errors } = useCheckoutMessages();
	const defaultMessages = useMemo(
		() =>
			({
				invalid: errors.invalid,
				required: errors.required,
				unique: errors.unique,
				emailInvalid: errors.emailInvalid,
				passwordAtLeastCharacters: errors.passwordAtLeastCharacters,
				passwordTooShort: errors.passwordTooShort,
				passwordTooSimilar: errors.passwordTooSimilar,
				passwordTooCommon: errors.passwordTooCommon,
				passwordInvalid: errors.passwordInvalid,
				quantityGreaterThanLimit: errors.quantityGreaterThanLimit,
				insufficientStock: errors.insufficientStock,
				invalidCredentials: errors.invalidCredentials,
				missingFields: errors.missingFields,
			}) satisfies Record<ErrorCode, string>,
		[errors],
	);
	const messagesToUse = customMessages || defaultMessages;

	const getMessageByErrorCode = useCallback(
		(errorCode: string) => {
			const formattedMessage = messagesToUse[errorCode as keyof typeof messagesToUse];
			if (!formattedMessage) {
				console.warn(`Missing trnalsation: ${errorCode}`);
				return "";
			}
			return formattedMessage;
		},
		[messagesToUse],
	);

	const translatedErrorMessages = useMemo(
		() =>
			Object.keys(messagesToUse).reduce(
				(result, key) => ({
					...result,
					[key]: getMessageByErrorCode(key as TKey),
				}),
				{} as Record<TKey, string>,
			),
		[defaultMessages, getMessageByErrorCode, messagesToUse],
	);

	return {
		errorMessages: translatedErrorMessages,
		getMessageByErrorCode,
	};
};
