/**
 * Minimal shape of a next-intl translator scoped to a namespace that has an
 * `errors` object with an `unknown` entry (e.g. useTranslations("auth")).
 */
type ErrorTranslator = {
	(key: string): string;
	has(key: string): boolean;
};

/**
 * Turns an error code from an API response into a customer-facing message.
 *
 * next-intl has no `defaultValue` option — an unknown key renders its raw path
 * ("auth.errors.SOME_CODE"). This only returns `errors.<code>` when that key
 * exists and otherwise falls back to the translated `errors.unknown`, so a raw
 * key or an upstream code can never reach the UI.
 */
export function resolveErrorMessage(t: ErrorTranslator, code: string | null | undefined): string {
	const key = `errors.${code}`;
	return code && t.has(key) ? t(key) : t("errors.unknown");
}
