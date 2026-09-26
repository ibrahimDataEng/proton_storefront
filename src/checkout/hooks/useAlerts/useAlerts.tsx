/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { toast } from "react-toastify";
import { camelCase } from "lodash-es";
import { useCallback } from "react";
import {
	type Alert,
	type AlertErrorData,
	type AlertType,
	type CheckoutScope,
	type CustomError,
} from "./types";
import { type ErrorCode } from "@/checkout/lib/globalTypes";
import { type ApiErrors } from "@/checkout/hooks/useGetParsedErrors/types";
import { useGetParsedErrors } from "@/checkout/hooks/useGetParsedErrors";
import { useApiErrorMessages } from "@/checkout/sections/PaymentSection/errorMessages";

interface ShowErrorsOptions {
	// Shown instead of apiErrors.somethingWentWrong when a code has no message.
	fallbackMessage?: string;
}

function useAlerts(scope: CheckoutScope): {
	showErrors: (errors: ApiErrors<any>) => void;
	showCustomErrors: (errors: CustomError[]) => void;
	showSuccess: (message: string) => void;
};

function useAlerts(): {
	showErrors: (errors: ApiErrors<any>, scope: CheckoutScope, options?: ShowErrorsOptions) => void;
	showCustomErrors: (errors: CustomError[], scope?: CheckoutScope) => void;
	showSuccess: (message: string) => void;
};

function useAlerts(globalScope?: any): any {
	const apiErrorMessages = useApiErrorMessages();
	const { getParsedApiErrors } = useGetParsedErrors<any>();

	// Saleor sends `field: null` for errors that aren't tied to an input, so
	// the key is built from the parts that exist ("checkoutPay-emailNotSet",
	// not "checkoutPay-null-emailNotSet").
	const getMessageKey = (...parts: Array<string | null | undefined>) =>
		camelCase([...parts.filter(Boolean), "error"].join("-"));

	const getErrorMessage = useCallback(
		({ code, field, scope }: AlertErrorData, fallbackMessage?: string): string => {
			// Most specific first (scope + field + code), then scope + code, so a
			// message can be keyed by code alone when the field Saleor attaches is
			// incidental (e.g. checkoutComplete's SHIPPING_METHOD_NOT_SET).
			// `in` rather than a lookup in try/catch: a missing key returns
			// undefined, it never throws — the old catch never ran, so every
			// unmapped code produced an empty toast.
			const messageKeys = [getMessageKey(scope, field, code), getMessageKey(scope, code)];
			const messageKey = messageKeys.find((key) => key in apiErrorMessages) as
				| keyof typeof apiErrorMessages
				| undefined;

			if (messageKey) {
				return apiErrorMessages[messageKey];
			}

			console.warn(`Missing translation: ${messageKeys[0]}`);
			return fallbackMessage || apiErrorMessages.somethingWentWrong;
		},
		[apiErrorMessages],
	);

	const getParsedAlert = useCallback(
		(data: AlertErrorData, type: AlertType, fallbackMessage?: string): Alert => {
			const { scope, field, code } = data;

			return {
				id: camelCase(`${scope}-${field}-${code}`),
				message: getErrorMessage({ scope, code, field }, fallbackMessage),
				type,
			};
		},
		[getErrorMessage],
	);

	const showAlert = useCallback(
		({ message, type = "error", ...rest }: Pick<Alert, "message"> & { type?: AlertType; id?: string }) =>
			toast(<p>{message}</p>, { type, ...rest }),
		[],
	);

	const showDefaultAlert = useCallback(
		(
			alertErrorData: AlertErrorData,
			{ type = "error", fallbackMessage }: { type?: AlertType; fallbackMessage?: string } = {},
		) => {
			const parsedAlert = getParsedAlert(alertErrorData, type, fallbackMessage);
			showAlert(parsedAlert);
		},
		[getParsedAlert, showAlert],
	);

	const showErrors = useCallback(
		(errors: ApiErrors<any>, scope: CheckoutScope = globalScope, options: ShowErrorsOptions = {}) =>
			getParsedApiErrors(errors).forEach((error) =>
				showDefaultAlert({ ...error, scope } as AlertErrorData, { fallbackMessage: options.fallbackMessage }),
			),
		[getParsedApiErrors, globalScope, showDefaultAlert],
	);

	const showCustomErrors = useCallback(
		(errors: CustomError[], scope: CheckoutScope = globalScope) => {
			const parsedErrors = errors.map((error) => ({ field: "", message: "", code: "", ...error }));

			parsedErrors.forEach(({ field, message, code }) => {
				if (message) {
					showAlert({ message });
				} else if (field && code) {
					showDefaultAlert({ scope, field, code: code as ErrorCode });
				} else {
					showAlert({ message: apiErrorMessages.somethingWentWrong });
				}
			});
		},
		[apiErrorMessages.somethingWentWrong, globalScope, showAlert, showDefaultAlert],
	);

	const showSuccess = useCallback(
		(message: string) => {
			showAlert({ message, type: "success" });
		},
		[showAlert],
	);

	return { showErrors, showCustomErrors, showSuccess };
}

export { useAlerts };
