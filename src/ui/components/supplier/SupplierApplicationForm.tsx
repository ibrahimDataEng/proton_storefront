"use client";

import { type FocusEvent, type FormEvent, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { Container } from "@/ui/components/Container";
import { COUNTRIES } from "@/ui/components/home/CountrySection";
import { SupplierFileUpload } from "@/ui/components/supplier/SupplierFileUpload";
import { TurnstileWidget } from "@/ui/components/supplier/TurnstileWidget";

type FormStatus = "idle" | "sending" | "sent" | "error";

const CATEGORY_KEYS = [
	"nuts",
	"driedFruits",
	"seeds",
	"coffee",
	"snacks",
	"spices",
	"staples",
	"herbs",
] as const;
const PHONE_CODES = ["+971", "+963", "+20", "+90", "other"] as const;

const BUSINESS_TYPE_OPTIONS = [
	{ key: "manufacturer", labelKey: "businessTypeManufacturer" },
	{ key: "farmer", labelKey: "businessTypeFarmer" },
	{ key: "distributor", labelKey: "businessTypeDistributor" },
	{ key: "importer", labelKey: "businessTypeImporter" },
	{ key: "broker", labelKey: "businessTypeBroker" },
] as const;

const CERT_OPTIONS = [
	{ key: "iso", labelKey: "certIso" },
	{ key: "haccp", labelKey: "certHaccp" },
	{ key: "halal", labelKey: "certHalal" },
	{ key: "other", labelKey: "certOther" },
] as const;

interface FormValues {
	companyName: string;
	country: string;
	contactName: string;
	website: string;
	email: string;
	phoneCode: string;
	phoneCodeOther: string;
	phoneNumber: string;
	businessType: string;
	categories: string[];
	products: string;
	natureOfBusiness: string;
	certifications: string[];
	termsAgreed: boolean;
}

const initialValues: FormValues = {
	companyName: "",
	country: "",
	contactName: "",
	website: "",
	email: "",
	phoneCode: "+971",
	phoneCodeOther: "",
	phoneNumber: "",
	businessType: "",
	categories: [],
	products: "",
	natureOfBusiness: "",
	certifications: [],
	termsAgreed: false,
};

type FieldName = keyof FormValues;
type Errors = Partial<Record<FieldName, string>>;

const NATURE_MAX = 2000;

export function SupplierApplicationForm() {
	const t = useTranslations("supplier.form");
	const tCategories = useTranslations("supplier.categories");

	const [values, setValues] = useState<FormValues>(initialValues);
	const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
	const [errors, setErrors] = useState<Errors>({});
	const [file, setFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState("");
	const [turnstileKey, setTurnstileKey] = useState(0);
	const [turnstileError, setTurnstileError] = useState(false);
	const [status, setStatus] = useState<FormStatus>("idle");

	const validateField = (name: FieldName, v: FormValues): string | undefined => {
		switch (name) {
			case "companyName":
			case "country":
			case "contactName":
			case "businessType":
			case "products":
			case "natureOfBusiness":
				return v[name].toString().trim() ? undefined : t("required");
			case "email":
				if (!v.email.trim()) return t("required");
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return t("invalidEmail");
				return undefined;
			case "website":
				if (!v.website.trim()) return undefined;
				return /^https?:\/\/.+/.test(v.website) ? undefined : t("invalidUrl");
			case "phoneNumber": {
				if (!v.phoneNumber.trim()) return t("required");
				if (v.phoneCode === "other" && !v.phoneCodeOther.trim()) return t("invalidPhone");
				return /^[0-9\s-]{5,}$/.test(v.phoneNumber) ? undefined : t("invalidPhone");
			}
			case "categories":
				return v.categories.length > 0 ? undefined : t("selectAtLeastOne");
			case "termsAgreed":
				return v.termsAgreed ? undefined : t("required");
			default:
				return undefined;
		}
	};

	const validateAll = (v: FormValues): Errors => {
		const fields: FieldName[] = [
			"companyName",
			"country",
			"contactName",
			"website",
			"email",
			"phoneNumber",
			"businessType",
			"categories",
			"products",
			"natureOfBusiness",
			"termsAgreed",
		];
		const next: Errors = {};
		for (const field of fields) {
			const message = validateField(field, v);
			if (message) next[field] = message;
		}
		return next;
	};

	const setValue = <K extends FieldName>(name: K, value: FormValues[K]) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleBlur = (name: FieldName) => (_e: FocusEvent) => {
		setTouched((prev) => ({ ...prev, [name]: true }));
		setErrors((prev) => ({ ...prev, [name]: validateField(name, values) }));
	};

	const toggleCategory = (key: string) => {
		setValues((prev) => ({
			...prev,
			categories: prev.categories.includes(key)
				? prev.categories.filter((c) => c !== key)
				: [...prev.categories, key],
		}));
		setTouched((prev) => ({ ...prev, categories: true }));
	};

	const toggleCertification = (key: string) => {
		setValues((prev) => ({
			...prev,
			certifications: prev.certifications.includes(key)
				? prev.certifications.filter((c) => c !== key)
				: [...prev.certifications, key],
		}));
	};

	const resetForm = () => {
		setValues(initialValues);
		setTouched({});
		setErrors({});
		setFile(null);
		setFileError(null);
		setTurnstileToken("");
		setTurnstileKey((k) => k + 1);
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const allErrors = validateAll(values);
		setErrors(allErrors);
		setTouched({
			companyName: true,
			country: true,
			contactName: true,
			website: true,
			email: true,
			phoneNumber: true,
			businessType: true,
			categories: true,
			products: true,
			natureOfBusiness: true,
			termsAgreed: true,
		});

		if (Object.keys(allErrors).length > 0) return;

		if (!turnstileToken) {
			setTurnstileError(true);
			return;
		}
		setTurnstileError(false);

		setStatus("sending");

		const resolvedPhoneCode = values.phoneCode === "other" ? values.phoneCodeOther : values.phoneCode;

		const formData = new FormData();
		formData.append("companyName", values.companyName);
		formData.append("country", values.country);
		formData.append("contactName", values.contactName);
		formData.append("website", values.website);
		formData.append("email", values.email);
		formData.append("phoneCode", resolvedPhoneCode);
		formData.append("phoneNumber", values.phoneNumber);
		formData.append("businessType", values.businessType);
		values.categories.forEach((c) => formData.append("categories", c));
		formData.append("products", values.products);
		formData.append("natureOfBusiness", values.natureOfBusiness);
		values.certifications.forEach((c) => formData.append("certifications", c));
		formData.append("turnstileToken", turnstileToken);
		formData.append("termsAgreed", String(values.termsAgreed));
		formData.append("website_url_2", "");
		if (file) formData.append("file", file);

		try {
			const res = await fetch("/api/supplier", { method: "POST", body: formData });
			const data = (await res.json()) as { success?: boolean; error?: string };
			if (data.success) {
				setStatus("sent");
				setTimeout(() => {
					setStatus("idle");
					resetForm();
				}, 6000);
			} else {
				setStatus("error");
				setTurnstileToken("");
				setTurnstileKey((k) => k + 1);
				setTimeout(() => setStatus("idle"), 6000);
			}
		} catch {
			setStatus("error");
			setTurnstileToken("");
			setTurnstileKey((k) => k + 1);
			setTimeout(() => setStatus("idle"), 6000);
		}
	};

	// No width/horizontal-padding here on purpose — those vary per field (full-width
	// vs. the phone row's fixed-width code select + flexible number input), and mixing
	// a width utility here with a different one at the call site is a cascade footgun:
	// both target the same CSS property with equal specificity, so whichever wins is
	// decided by Tailwind's internal generation order, not by the order classes are
	// listed on the element. Each caller supplies its own width and horizontal padding.
	const inputBaseClass = (hasError: boolean) =>
		clsx(
			"rounded-lg border py-3 text-content-primary placeholder:text-content-secondary/50",
			"bg-surface-base outline-none transition-colors",
			"focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
			hasError ? "border-red-400" : "border-line-default",
		);

	const inputClass = (hasError: boolean) => clsx(inputBaseClass(hasError), "w-full px-4");

	const fieldError = (name: FieldName) => (touched[name] ? errors[name] : undefined);

	return (
		<section id="apply" className="py-16 md:py-24">
			<Container size="md">
				<div className="mb-10 text-center">
					<h2 className="text-3xl font-bold text-content-primary md:text-4xl">{t("sectionTitle")}</h2>
					<p className="mt-3 text-content-secondary">{t("sectionSubtitle")}</p>
				</div>

				<form
					onSubmit={handleSubmit}
					noValidate
					className="flex flex-col gap-6 rounded-2xl border border-line-subtle bg-surface-raised p-6 shadow-soft md:p-8"
				>
					{/* Honeypot — hidden from real users, left empty by them; bots that autofill it get silently rejected server-side */}
					<input
						type="text"
						name="website_url_2"
						tabIndex={-1}
						autoComplete="off"
						aria-hidden="true"
						className="absolute left-[-9999px] h-0 w-0 opacity-0"
					/>

					{/* Company name */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("companyNameLabel")}
						</label>
						<input
							type="text"
							dir="auto"
							value={values.companyName}
							onChange={(e) => setValue("companyName", e.target.value)}
							onBlur={handleBlur("companyName")}
							placeholder={t("companyNamePlaceholder")}
							className={inputClass(!!fieldError("companyName"))}
						/>
						{fieldError("companyName") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("companyName")}</p>
						)}
					</div>

					{/* Country */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("countryLabel")}
						</label>
						<select
							value={values.country}
							onChange={(e) => setValue("country", e.target.value)}
							onBlur={handleBlur("country")}
							className={inputClass(!!fieldError("country"))}
						>
							<option value="">{t("countryPlaceholder")}</option>
							{COUNTRIES.map((c) => (
								<option key={c.slug} value={c.slug}>
									{c.emoji} {c.nameEn}
								</option>
							))}
						</select>
						{fieldError("country") && <p className="mt-1 text-xs text-red-500">{fieldError("country")}</p>}
					</div>

					{/* Sales contact name */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("contactNameLabel")}
						</label>
						<input
							type="text"
							dir="auto"
							value={values.contactName}
							onChange={(e) => setValue("contactName", e.target.value)}
							onBlur={handleBlur("contactName")}
							placeholder={t("contactNamePlaceholder")}
							className={inputClass(!!fieldError("contactName"))}
						/>
						{fieldError("contactName") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("contactName")}</p>
						)}
					</div>

					{/* Website */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("websiteLabel")}
						</label>
						<input
							type="url"
							dir="ltr"
							value={values.website}
							onChange={(e) => setValue("website", e.target.value)}
							onBlur={handleBlur("website")}
							placeholder={t("websitePlaceholder")}
							className={inputClass(!!fieldError("website"))}
						/>
						{fieldError("website") && <p className="mt-1 text-xs text-red-500">{fieldError("website")}</p>}
					</div>

					{/* Email */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">{t("emailLabel")}</label>
						<input
							type="email"
							dir="ltr"
							value={values.email}
							onChange={(e) => setValue("email", e.target.value)}
							onBlur={handleBlur("email")}
							placeholder={t("emailPlaceholder")}
							className={inputClass(!!fieldError("email"))}
						/>
						{fieldError("email") && <p className="mt-1 text-xs text-red-500">{fieldError("email")}</p>}
					</div>

					{/* Phone */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">{t("phoneLabel")}</label>
						<div className="flex gap-2">
							<select
								value={values.phoneCode}
								onChange={(e) => setValue("phoneCode", e.target.value)}
								onBlur={handleBlur("phoneNumber")}
								className={clsx(inputBaseClass(false), "w-28 shrink-0 px-3")}
								aria-label={t("phoneCodeLabel")}
							>
								{PHONE_CODES.map((code) => (
									<option key={code} value={code}>
										{code === "other" ? t("phoneCodeOther") : code}
									</option>
								))}
							</select>
							{values.phoneCode === "other" && (
								<input
									type="text"
									dir="ltr"
									value={values.phoneCodeOther}
									onChange={(e) => setValue("phoneCodeOther", e.target.value)}
									onBlur={handleBlur("phoneNumber")}
									placeholder={t("phoneCodeOtherPlaceholder")}
									className={clsx(inputBaseClass(!!fieldError("phoneNumber")), "w-24 shrink-0 px-3")}
								/>
							)}
							<input
								type="tel"
								dir="ltr"
								value={values.phoneNumber}
								onChange={(e) => setValue("phoneNumber", e.target.value)}
								onBlur={handleBlur("phoneNumber")}
								placeholder={t("phoneNumberPlaceholder")}
								className={clsx(inputBaseClass(!!fieldError("phoneNumber")), "min-w-0 flex-1 px-4")}
							/>
						</div>
						{fieldError("phoneNumber") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("phoneNumber")}</p>
						)}
					</div>

					{/* Business type */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("businessTypeLabel")}
						</label>
						<select
							value={values.businessType}
							onChange={(e) => setValue("businessType", e.target.value)}
							onBlur={handleBlur("businessType")}
							className={inputClass(!!fieldError("businessType"))}
						>
							<option value="">{t("businessTypePlaceholder")}</option>
							{BUSINESS_TYPE_OPTIONS.map((opt) => (
								<option key={opt.key} value={opt.key}>
									{t(opt.labelKey)}
								</option>
							))}
						</select>
						{fieldError("businessType") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("businessType")}</p>
						)}
					</div>

					{/* Category chips */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("categoryLabel")}
						</label>
						<p className="mb-2 text-xs text-content-secondary">{t("categoryHelp")}</p>
						<div className="flex flex-wrap gap-2">
							{CATEGORY_KEYS.map((key) => {
								const active = values.categories.includes(key);
								return (
									<button
										key={key}
										type="button"
										aria-pressed={active}
										onClick={() => toggleCategory(key)}
										className={clsx(
											"rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
											active
												? "border-brand-primary bg-brand-primary text-content-inverse"
												: "border-line-default bg-surface-base text-content-secondary hover:border-brand-primary/40",
										)}
									>
										{tCategories(key)}
									</button>
								);
							})}
						</div>
						{fieldError("categories") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("categories")}</p>
						)}
					</div>

					{/* Proposed products */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("productLabel")}
						</label>
						<textarea
							dir="auto"
							rows={3}
							value={values.products}
							onChange={(e) => setValue("products", e.target.value)}
							onBlur={handleBlur("products")}
							placeholder={t("productPlaceholder")}
							className={clsx(inputClass(!!fieldError("products")), "resize-none")}
						/>
						{fieldError("products") && <p className="mt-1 text-xs text-red-500">{fieldError("products")}</p>}
					</div>

					{/* Nature of business */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("natureLabel")}
						</label>
						<textarea
							dir="auto"
							rows={5}
							maxLength={NATURE_MAX}
							value={values.natureOfBusiness}
							onChange={(e) => setValue("natureOfBusiness", e.target.value.slice(0, NATURE_MAX))}
							onBlur={handleBlur("natureOfBusiness")}
							placeholder={t("naturePlaceholder")}
							className={clsx(inputClass(!!fieldError("natureOfBusiness")), "resize-none")}
						/>
						<div className="mt-1 flex items-center justify-between">
							{fieldError("natureOfBusiness") ? (
								<p className="text-xs text-red-500">{fieldError("natureOfBusiness")}</p>
							) : (
								<span />
							)}
							<p className="text-xs text-content-secondary">
								{t("natureCounter", { count: values.natureOfBusiness.length, max: NATURE_MAX })}
							</p>
						</div>
					</div>

					{/* Certifications */}
					<div>
						<label className="mb-2 block text-sm font-medium text-content-primary">
							{t("certificationsLabel")}
						</label>
						<div className="flex flex-wrap gap-4">
							{CERT_OPTIONS.map((opt) => (
								<label key={opt.key} className="flex items-center gap-2 text-sm text-content-primary">
									<input
										type="checkbox"
										checked={values.certifications.includes(opt.key)}
										onChange={() => toggleCertification(opt.key)}
										className="h-4 w-4 rounded border-line-default text-brand-primary focus:ring-brand-primary/30"
									/>
									{t(opt.labelKey)}
								</label>
							))}
						</div>
					</div>

					{/* File upload */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-content-primary">
							{t("uploadLabel")}
						</label>
						<SupplierFileUpload file={file} onChange={setFile} error={fileError} onError={setFileError} />
					</div>

					{/* Turnstile */}
					<div>
						<TurnstileWidget
							key={turnstileKey}
							onVerify={(token) => {
								setTurnstileToken(token);
								setTurnstileError(false);
							}}
							onExpire={() => setTurnstileToken("")}
						/>
						{turnstileError && <p className="mt-1 text-xs text-red-500">{t("turnstileError")}</p>}
					</div>

					{/* Terms */}
					<div>
						<label className="flex items-start gap-2 text-sm text-content-primary">
							<input
								type="checkbox"
								checked={values.termsAgreed}
								onChange={(e) => setValue("termsAgreed", e.target.checked)}
								onBlur={handleBlur("termsAgreed")}
								className="mt-0.5 h-4 w-4 rounded border-line-default text-brand-primary focus:ring-brand-primary/30"
							/>
							{t("termsLabel")}
						</label>
						{fieldError("termsAgreed") && (
							<p className="mt-1 text-xs text-red-500">{fieldError("termsAgreed")}</p>
						)}
					</div>

					{/* Submit */}
					<button
						type="submit"
						disabled={status === "sending" || status === "sent"}
						className={clsx(
							"inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 font-medium transition-all duration-300",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
							"disabled:pointer-events-none",
							status === "sent"
								? "bg-green-600 text-white"
								: status === "error"
									? "bg-red-600 text-white"
									: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
						)}
					>
						<AnimatePresence mode="wait" initial={false}>
							{status === "sending" ? (
								<m.span
									key="sending"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									className="flex items-center gap-2"
								>
									<Loader2 className="h-4 w-4 animate-spin" />
									{t("sending")}
								</m.span>
							) : status === "sent" ? (
								<m.span
									key="sent"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									className="flex items-center gap-2"
								>
									<CheckCircle className="h-4 w-4" />
									{t("sent")}
								</m.span>
							) : status === "error" ? (
								<m.span
									key="error"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									className="flex items-center gap-2"
								>
									<AlertCircle className="h-4 w-4" />
									{t("sendError")}
								</m.span>
							) : (
								<m.span
									key="idle"
									initial={{ opacity: 0, y: -8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 8 }}
									className="flex items-center gap-2"
								>
									<Send className="h-4 w-4" />
									{t("submit")}
								</m.span>
							)}
						</AnimatePresence>
					</button>

					<AnimatePresence>
						{status === "sent" && (
							<m.p
								key="sent-note"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								className="text-center text-sm text-content-secondary"
							>
								{t("sentSubtitle")}
							</m.p>
						)}
						{status === "error" && (
							<m.p
								key="error-note"
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								className="text-center text-sm text-red-500"
							>
								{t("sendError")}
							</m.p>
						)}
					</AnimatePresence>
				</form>
			</Container>
		</section>
	);
}
