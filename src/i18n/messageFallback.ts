import { IntlErrorCode, type IntlError } from "next-intl";

/**
 * Missing-message policy, shared by the server config (src/i18n/request.ts) and
 * the client provider (IntlClientProvider.tsx). No "use client"/"server-only":
 * both sides import it, and functions can't cross the RSC boundary, so each side
 * builds its own instances from the same messages object.
 *
 * - A missing key under an `errors` object renders a translated generic error,
 *   never its key path. Error codes come from APIs, so this is where an unmapped
 *   code would otherwise leak ("auth.errors.SOME_CODE").
 * - Any other missing key keeps next-intl's default (the key path). It's never
 *   empty, and `pnpm run i18n:check` (prebuild) fails the build on any en/ar gap,
 *   so it can only happen for a key missing from both locales.
 * - Every missing key is logged once per process with the `[i18n:missing]` prefix.
 *   In development next-intl's default console.error (with stack) is kept too.
 */

type Messages = Record<string, unknown>;

const ERRORS_SEGMENT = ".errors.";
/** Used when the namespace has no `errors.unknown` of its own. Exists in en + ar. */
const GLOBAL_GENERIC_ERROR_KEY = "error.description";

function lookup(messages: Messages, path: string): string | undefined {
	let node: unknown = messages;
	for (const part of path.split(".")) {
		if (!node || typeof node !== "object") return undefined;
		node = (node as Record<string, unknown>)[part];
	}
	return typeof node === "string" && node ? node : undefined;
}

function genericErrorFor(messages: Messages, path: string): string | undefined {
	const at = path.lastIndexOf(ERRORS_SEGMENT);
	const ownUnknown = at >= 0 ? `${path.slice(0, at + ERRORS_SEGMENT.length)}unknown` : "errors.unknown";
	return lookup(messages, ownUnknown) ?? lookup(messages, GLOBAL_GENERIC_ERROR_KEY);
}

function isErrorPath(path: string): boolean {
	return path.includes(ERRORS_SEGMENT) || path.startsWith("errors.");
}

export function createGetMessageFallback(messages: Messages) {
	return function getMessageFallback({ namespace, key }: { namespace?: string; key: string }): string {
		const path = namespace ? `${namespace}.${key}` : key;
		if (isErrorPath(path)) {
			const generic = genericErrorFor(messages, path);
			if (generic) return generic;
		}
		return path;
	};
}

const reported = new Set<string>();

export function createOnError(locale: string) {
	return function onError(error: IntlError): void {
		if (error.code !== IntlErrorCode.MISSING_MESSAGE) {
			console.error(error);
			return;
		}
		if (process.env.NODE_ENV !== "production") console.error(error);
		const id = `${locale}:${error.originalMessage ?? error.message}`;
		if (reported.has(id)) return;
		reported.add(id);
		console.error(`[i18n:missing] ${error.originalMessage ?? error.message}`);
	};
}
