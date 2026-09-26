/**
 * Every `error` code the /account server actions (account/actions.ts) can return.
 * Same contract as AUTH_ERROR_CODES (src/lib/auth/errorCodes.ts):
 * scripts/check-i18n-parity.mjs reads this list and fails the build if any code
 * lacks an `account.errors.<CODE>` message in en.json or ar.json, and callers
 * render codes via resolveErrorMessage(t, code) — never a Saleor message string.
 *
 * Keep this a plain string-literal array (the parity script extracts it with a regex).
 */
export const ACCOUNT_ERROR_CODES = [
	"unknown",
	"SESSION_EXPIRED",
	"EMIRATE_REQUIRED",
	"REQUIRED_FIELD_MISSING",
	"PHONE_INVALID",
	"POSTAL_CODE_INVALID",
	"INVALID_FIELD",
	"NOT_FOUND",
] as const;

export type AccountErrorCode = (typeof ACCOUNT_ERROR_CODES)[number];

/** Saleor AccountError (code + field) → our code. Unmapped → "unknown". */
export function mapAccountError(
	code: string | null | undefined,
	field: string | null | undefined,
): AccountErrorCode {
	if (code === "REQUIRED") return field === "countryArea" ? "EMIRATE_REQUIRED" : "REQUIRED_FIELD_MISSING";
	if (code === "INVALID") {
		if (field === "phone") return "PHONE_INVALID";
		if (field === "postalCode") return "POSTAL_CODE_INVALID";
		if (field === "countryArea") return "EMIRATE_REQUIRED";
		return "INVALID_FIELD";
	}
	if (code === "NOT_FOUND") return "NOT_FOUND";
	return "unknown";
}

// Saleor answers a missing/invalid/expired access token with HTTP 200 and a
// top-level GraphQL error (extensions.exception.code), which executeGraphQL
// throws as its GraphQLError (the parsed body is kept on `errorResponse`).
const SESSION_EXCEPTION_CODES =
	/PermissionDenied|Signature|JSONWebToken|DecodeError|InvalidToken|ExpiredToken/i;

export function isSessionError(error: unknown): boolean {
	const errors = (error as { errorResponse?: { errors?: unknown } } | null)?.errorResponse?.errors;
	if (!Array.isArray(errors)) return false;
	return errors.some((e) => {
		const code = (e as { extensions?: { exception?: { code?: unknown } } })?.extensions?.exception?.code;
		return typeof code === "string" && SESSION_EXCEPTION_CODES.test(code);
	});
}
