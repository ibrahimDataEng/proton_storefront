/**
 * Every `error` code the auth Route Handlers (src/app/api/auth/*) can put in a
 * response body. Single source of truth for the code→message contract:
 * scripts/check-i18n-parity.mjs reads this list and fails the build if any code
 * lacks an `auth.errors.<CODE>` message in en.json or ar.json.
 *
 * Routes must only ever emit a code from this list — never a raw Saleor code.
 * Map upstream codes through an explicit table and fall back to "unknown".
 *
 * Keep this a plain string-literal array: the parity script extracts it with a
 * regex (it runs under plain Node before the build, without a TS loader).
 */
export const AUTH_ERROR_CODES = [
	"unknown",
	"unauthorized",
	"MISSING_FIELDS",
	"EMAIL_PASSWORD_REQUIRED",
	"INVALID",
	"INVALID_CREDENTIALS",
	"ACCOUNT_NOT_CONFIRMED",
	"INACTIVE",
	"LOGIN_ATTEMPT_DELAYED",
	"UNIQUE",
	"PASSWORD_TOO_SHORT",
	"PASSWORD_TOO_SIMILAR",
	"PASSWORD_TOO_COMMON",
	"PASSWORD_ENTIRELY_NUMERIC",
	"INVALID_PASSWORD",
	"TOKEN_INVALID",
	"PHONE_CODE_REQUIRED",
	"INVALID_OR_EXPIRED_CODE",
	"NO_REFRESH_TOKEN",
	"REFRESH_FAILED",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];
