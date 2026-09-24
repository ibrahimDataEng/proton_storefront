/**
 * Client-side validation shared by the auth forms (LoginForm, RegisterForm,
 * ForgotPasswordForm). Returns reason codes, never strings — each form renders
 * them through `t(VALIDATION_MESSAGE_KEYS[reason])` in the `auth` namespace, so
 * the text is always locale-controlled (the forms keep `noValidate`, which
 * suppresses the browser's own locale-dependent validation bubbles).
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Same shape used by the contact/supplier forms and the checkout email check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthValidationReason =
	| "emailRequired"
	| "emailInvalid"
	| "passwordRequired"
	| "passwordTooShort"
	| "confirmPasswordRequired"
	| "passwordMismatch"
	| "identifierRequired"
	| "identifierInvalid";

/** Message key (relative to the `auth` namespace) for each reason. */
export const VALIDATION_MESSAGE_KEYS: Record<AuthValidationReason, string> = {
	emailRequired: "validation.emailRequired",
	emailInvalid: "validation.emailInvalid",
	passwordRequired: "validation.passwordRequired",
	passwordTooShort: "errors.PASSWORD_TOO_SHORT",
	confirmPasswordRequired: "validation.confirmPasswordRequired",
	passwordMismatch: "errors.PASSWORD_MISMATCH",
	identifierRequired: "validation.identifierRequired",
	identifierInvalid: "validation.identifierInvalid",
};

export type FieldErrors<F extends string> = Partial<Record<F, AuthValidationReason>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
	return Object.values(errors).some(Boolean);
}

export function validateEmail(value: string): AuthValidationReason | undefined {
	const trimmed = value.trim();
	if (!trimmed) return "emailRequired";
	return EMAIL_PATTERN.test(trimmed) ? undefined : "emailInvalid";
}

/** Sign-in password: only presence is checked (never leak the password policy at login). */
export function validateExistingPassword(value: string): AuthValidationReason | undefined {
	return value ? undefined : "passwordRequired";
}

export function validateNewPassword(value: string): AuthValidationReason | undefined {
	if (!value) return "passwordRequired";
	return value.length < MIN_PASSWORD_LENGTH ? "passwordTooShort" : undefined;
}

/** Empty confirm is its own error — "" === "" must not pass as a match. */
export function validateConfirmPassword(password: string, confirm: string): AuthValidationReason | undefined {
	if (!confirm) return "confirmPasswordRequired";
	return confirm === password ? undefined : "passwordMismatch";
}

type LoginIdentifierMode = "email" | "phone" | null;

/**
 * LoginForm's identifier. With phone login off the field is always an email.
 * With it on, `mode` is LoginForm's own detection result: null means the value
 * is neither email-like nor phone-like, which must produce a visible message
 * instead of a silent no-op.
 */
export function validateLoginIdentifier(
	value: string,
	mode: LoginIdentifierMode,
	phoneLoginEnabled: boolean,
): AuthValidationReason | undefined {
	if (!phoneLoginEnabled) return validateEmail(value);
	if (!value.trim()) return "identifierRequired";
	if (mode === "phone") return undefined;
	if (mode === "email") return validateEmail(value);
	return "identifierInvalid";
}

export function validateLogin(input: {
	identifier: string;
	password: string;
	mode: LoginIdentifierMode;
	phoneLoginEnabled: boolean;
}): FieldErrors<"identifier" | "password"> {
	const errors: FieldErrors<"identifier" | "password"> = {
		identifier: validateLoginIdentifier(input.identifier, input.mode, input.phoneLoginEnabled),
	};
	// The password field only exists in email mode.
	if (input.mode === "email") errors.password = validateExistingPassword(input.password);
	return errors;
}

export function validateRegister(input: {
	email: string;
	password: string;
	confirmPassword: string;
}): FieldErrors<"email" | "password" | "confirmPassword"> {
	return {
		email: validateEmail(input.email),
		password: validateNewPassword(input.password),
		confirmPassword: validateConfirmPassword(input.password, input.confirmPassword),
	};
}

export function validateForgotPassword(input: { email: string }): FieldErrors<"email"> {
	return { email: validateEmail(input.email) };
}
