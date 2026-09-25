"use client";

import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { authFieldErrorClassName, authInputClassName, authRequiredMarkClassName } from "./AuthFormField";

// Kept in sync with SupplierApplicationForm's own PHONE_CODES list by design — same
// primary markets, same "other" escape hatch — but this is now the shared source of
// truth; SupplierApplicationForm's own copy predates this component and is out of
// scope to refactor in this session.
export const PHONE_CODES = ["+971", "+963", "+20", "+90", "other"] as const;

export type PhoneFieldValues = {
	phoneCode: string;
	phoneCodeOther: string;
	phoneNumber: string;
};

export const EMPTY_PHONE_VALUES: PhoneFieldValues = {
	phoneCode: "+971",
	phoneCodeOther: "",
	phoneNumber: "",
};

/** Digits/spaces/dashes, 5+ chars — the bare-number half of validatePhoneFields below. */
const PHONE_DIGITS_PATTERN = /^[0-9\s-]{5,}$/;

/**
 * Same shape as PHONE_DIGITS_PATTERN but also allows a leading "+", for detecting a
 * phone-like value typed into a single combined field (no separate country-code
 * selector) — see the smart identifier field in LoginForm.tsx.
 */
export const PHONE_LIKE_PATTERN = /^\+?[0-9\s-]{5,}$/;

export function resolvePhoneCode(values: PhoneFieldValues): string {
	return values.phoneCode === "other" ? values.phoneCodeOther : values.phoneCode;
}

/** E.g. "+971" + "501234567" -> "+971501234567". proton_identity re-normalizes this server-side regardless. */
export function combinePhone(values: PhoneFieldValues): string {
	return `${resolvePhoneCode(values)}${values.phoneNumber.trim()}`;
}

/**
 * Same validation shape as SupplierApplicationForm's own phoneNumber check
 * (regex-based, no validation library) — returns a reason key, not a translated
 * string, so each caller maps it through its own i18n namespace.
 */
export function validatePhoneFields(values: PhoneFieldValues): "required" | "invalid" | undefined {
	if (!values.phoneNumber.trim()) return "required";
	if (values.phoneCode === "other" && !values.phoneCodeOther.trim()) return "invalid";
	return PHONE_DIGITS_PATTERN.test(values.phoneNumber) ? undefined : "invalid";
}

type Props = {
	id: string;
	values: PhoneFieldValues;
	onChange: (values: PhoneFieldValues) => void;
	onBlur?: () => void;
	error?: string;
	required?: boolean;
	label?: string;
};

/**
 * Shared phone input (country-code select + number field), extracted from
 * SupplierApplicationForm.tsx's inline pattern so RegisterForm and PhoneGate render
 * and validate it identically instead of duplicating the markup.
 */
export function PhoneField({ id, values, onChange, onBlur, error, required, label }: Props) {
	const t = useTranslations("phoneField");

	// Same recipe as AuthFormField so every auth input matches (surface, padding,
	// text size, error border) in both themes.
	const inputBaseClass = authInputClassName(Boolean(error));

	// Same @tailwindcss/forms RTL chevron fix as SupplierApplicationForm's compactSelectClass
	// (background-position has no logical-property equivalent, hence the rtl: variant).
	const selectClass = clsx(
		inputBaseClass,
		"w-28 shrink-0 bg-no-repeat ps-3 pe-8",
		"bg-[length:1.1em_1.1em] bg-[right_0.5rem_center] rtl:bg-[left_0.5rem_center]",
	);

	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-content-primary">
				{label ?? t("label")}
				{required && (
					<span className={authRequiredMarkClassName} aria-hidden="true">
						*
					</span>
				)}
			</label>
			<div className="flex gap-2">
				<select
					value={values.phoneCode}
					onChange={(e) => onChange({ ...values, phoneCode: e.target.value })}
					onBlur={onBlur}
					className={selectClass}
					aria-label={t("codeLabel")}
				>
					{PHONE_CODES.map((code) => (
						<option key={code} value={code}>
							{code === "other" ? t("codeOther") : code}
						</option>
					))}
				</select>
				{values.phoneCode === "other" && (
					<input
						type="text"
						dir="ltr"
						value={values.phoneCodeOther}
						onChange={(e) => onChange({ ...values, phoneCodeOther: e.target.value })}
						onBlur={onBlur}
						placeholder={t("codeOtherPlaceholder")}
						className={clsx(inputBaseClass, "w-24 shrink-0 px-3.5")}
					/>
				)}
				<input
					id={id}
					type="tel"
					dir="ltr"
					value={values.phoneNumber}
					onChange={(e) => onChange({ ...values, phoneNumber: e.target.value })}
					onBlur={onBlur}
					placeholder={t("numberPlaceholder")}
					aria-describedby={error ? `${id}-error` : undefined}
					aria-invalid={error ? "true" : undefined}
					className={clsx(inputBaseClass, "min-w-0 flex-1 px-3.5")}
				/>
			</div>
			{error && (
				<p id={`${id}-error`} role="alert" className={authFieldErrorClassName}>
					{error}
				</p>
			)}
		</div>
	);
}
