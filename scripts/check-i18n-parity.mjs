#!/usr/bin/env node
/**
 * i18n contract check — runs from `prebuild` (so also inside the Docker image
 * build) and via `pnpm run i18n:check`. Plain Node, no dependencies.
 *
 * Fails (exit 1) on:
 *   1. key-tree differences between src/messages/en.json and ar.json
 *   2. empty (or non-string) leaf values
 *   3. ICU argument mismatches ({name} / {count, plural, ...}) between locales
 *   4. any code in AUTH_ERROR_CODES (src/lib/auth/errorCodes.ts) without an
 *      `auth.errors.<CODE>` message in both locales
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["en", "ar"];
const ERROR_CODES_FILE = "src/lib/auth/errorCodes.ts";

const problems = [];

function readJson(rel) {
	return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

/** { "a.b.c": value } for every leaf. */
function flatten(node, prefix = "", out = {}) {
	for (const [key, value] of Object.entries(node)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, path, out);
		else out[path] = value;
	}
	return out;
}

/**
 * ICU argument names used by a message. Recurses into plural/select/selectordinal
 * branch bodies but never treats a branch body itself as an argument, so locales
 * with different plural categories (ar has zero/two/few/many) still compare equal.
 */
function icuArguments(message) {
	const names = new Set();
	let i = 0;

	function skipSpaces() {
		while (i < message.length && /\s/.test(message[i])) i++;
	}

	function readUntil(stopChars) {
		const start = i;
		while (i < message.length && !stopChars.includes(message[i])) i++;
		return message.slice(start, i).trim();
	}

	// Parses message text until an unmatched "}" (or end of string).
	function parseMessage() {
		while (i < message.length) {
			const ch = message[i];
			if (ch === "}") return;
			if (ch === "{") {
				i++;
				parseArgument();
			} else {
				i++;
			}
		}
	}

	function parseArgument() {
		skipSpaces();
		const name = readUntil([",", "}"]);
		if (name) names.add(name);
		if (message[i] === "}") {
			i++;
			return;
		}
		i++; // ","
		skipSpaces();
		const type = readUntil([",", "}"]);
		if (message[i] === "}") {
			i++;
			return;
		}
		i++; // ","
		if (type === "plural" || type === "select" || type === "selectordinal") {
			// selector {body} selector {body} ... }
			while (i < message.length) {
				skipSpaces();
				if (message[i] === "}") {
					i++;
					return;
				}
				readUntil(["{", "}"]);
				if (message[i] === "{") {
					i++;
					parseMessage();
					i++; // closing "}" of the branch body
				}
			}
		} else {
			// Style argument such as {amount, number, ::currency/AED}.
			let depth = 1;
			while (i < message.length && depth > 0) {
				if (message[i] === "{") depth++;
				else if (message[i] === "}") depth--;
				i++;
			}
		}
	}

	parseMessage();
	return [...names].sort();
}

// ---------------------------------------------------------------------------

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(readJson(`src/messages/${l}.json`))]));
const [base, ...others] = LOCALES;

// 1. key-tree parity
for (const other of others) {
	for (const key of Object.keys(flat[base])) {
		if (!(key in flat[other])) problems.push(`missing in ${other}.json: ${key}`);
	}
	for (const key of Object.keys(flat[other])) {
		if (!(key in flat[base])) problems.push(`missing in ${base}.json: ${key}`);
	}
}

// 2. empty / non-string values
for (const locale of LOCALES) {
	for (const [key, value] of Object.entries(flat[locale])) {
		if (typeof value !== "string") problems.push(`non-string value in ${locale}.json: ${key}`);
		else if (!value.trim()) problems.push(`empty value in ${locale}.json: ${key}`);
	}
}

// 3. ICU argument parity
for (const other of others) {
	for (const [key, value] of Object.entries(flat[base])) {
		const otherValue = flat[other][key];
		if (typeof value !== "string" || typeof otherValue !== "string") continue;
		const a = icuArguments(value).join(", ");
		const b = icuArguments(otherValue).join(", ");
		if (a !== b) problems.push(`placeholder mismatch at ${key}: ${base} {${a}} vs ${other} {${b}}`);
	}
}

// 4. auth error-code coverage
const codesSource = readFileSync(join(ROOT, ERROR_CODES_FILE), "utf8");
const listMatch = codesSource.match(/AUTH_ERROR_CODES\s*=\s*\[([\s\S]*?)\]\s*as const/);
const codes = listMatch ? [...listMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) : [];
if (codes.length === 0) {
	problems.push(
		`could not read AUTH_ERROR_CODES from ${ERROR_CODES_FILE} (keep it a plain string-literal array)`,
	);
}
for (const locale of LOCALES) {
	for (const code of codes) {
		const value = flat[locale][`auth.errors.${code}`];
		if (typeof value !== "string" || !value.trim()) {
			problems.push(`auth error code without a message in ${locale}.json: auth.errors.${code}`);
		}
	}
}

if (problems.length > 0) {
	console.error(`i18n check failed — ${problems.length} problem(s):`);
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}

console.log(
	`i18n check passed: ${Object.keys(flat[base]).length} keys × ${LOCALES.length} locales, ${
		codes.length
	} auth error codes covered.`,
);
