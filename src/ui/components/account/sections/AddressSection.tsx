"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import clsx from "clsx";
import {
	AuthFormField,
	authFieldErrorClassName,
	authInputClassName,
	authRequiredMarkClassName,
} from "@/ui/components/auth/AuthFormField";
import {
	createAddress,
	updateAddress,
	deleteAddress,
	setDefaultAddress,
} from "@/app/[locale]/[channel]/(main)/account/actions";
import type { CurrentUserOrderListQuery, AddressTypeEnum } from "@/gql/graphql";
import type { CountryAreaOption } from "@/lib/address/countryAreaChoices";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";
import {
	hasErrors,
	validateAddress,
	VALIDATION_MESSAGE_KEYS,
	type AddressField,
	type FieldErrors,
} from "@/lib/validation/auth";

type Address = NonNullable<NonNullable<CurrentUserOrderListQuery["me"]>["addresses"]>[number];

interface AddressFormState {
	firstName: string;
	lastName: string;
	streetAddress1: string;
	streetAddress2: string;
	city: string;
	postalCode: string;
	country: string;
	countryArea: string;
	phone: string;
	setShipping: boolean;
	setBilling: boolean;
}

const DEFAULT_FORM: AddressFormState = {
	firstName: "",
	lastName: "",
	streetAddress1: "",
	streetAddress2: "",
	city: "",
	postalCode: "",
	country: "AE",
	countryArea: "",
	phone: "",
	setShipping: false,
	setBilling: false,
};

function addressToForm(addr: Address): AddressFormState {
	return {
		firstName: addr.firstName ?? "",
		lastName: addr.lastName ?? "",
		streetAddress1: addr.streetAddress1 ?? "",
		streetAddress2: addr.streetAddress2 ?? "",
		city: addr.city ?? "",
		postalCode: addr.postalCode ?? "",
		country: addr.country.code ?? "AE",
		countryArea: addr.countryArea ?? "",
		phone: addr.phone ?? "",
		setShipping: addr.isDefaultShippingAddress ?? false,
		setBilling: addr.isDefaultBillingAddress ?? false,
	};
}

interface Props {
	addresses: Address[];
	emirateOptions: CountryAreaOption[];
}

function AddressForm({
	initial,
	onSave,
	onCancel,
	saving,
	error,
	emirateOptions,
	onEdit,
}: {
	initial: AddressFormState;
	emirateOptions: CountryAreaOption[];
	onSave: (form: AddressFormState) => Promise<void>;
	onCancel: () => void;
	saving: boolean;
	error: string | null;
	/** Any field edit — the parent clears its (now stale) server-error banner. */
	onEdit: () => void;
}) {
	const t = useTranslations("account");
	const tAuth = useTranslations("auth");
	const [form, setForm] = useState<AddressFormState>(initial);
	// Inline validation (shared validator, translated messages). The form keeps
	// noValidate so the browser's own locale-dependent bubbles never appear;
	// errors are set on submit, then re-checked per field on blur.
	const [fieldErrors, setFieldErrors] = useState<FieldErrors<AddressField>>({});
	const [submitted, setSubmitted] = useState(false);

	function set(key: keyof AddressFormState, value: string | boolean) {
		setForm((f) => ({ ...f, [key]: value }));
		onEdit();
	}

	function validateField(field: AddressField) {
		if (!submitted) return;
		setFieldErrors((prev) => ({ ...prev, [field]: validateAddress(form)[field] }));
	}

	function fieldError(field: AddressField) {
		const reason = fieldErrors[field];
		return reason ? tAuth(VALIDATION_MESSAGE_KEYS[reason]) : undefined;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitted(true);
		const errors = validateAddress(form);
		setFieldErrors(errors);
		if (hasErrors(errors)) return;
		await onSave(form);
	}

	const emirateError = fieldError("countryArea");

	return (
		<form
			onSubmit={handleSubmit}
			noValidate
			className="flex flex-col gap-4 rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle"
		>
			{error && (
				<p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
					{error}
				</p>
			)}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<AuthFormField
					id="addr-firstName"
					label={t("firstName")}
					value={form.firstName}
					onChange={(e) => set("firstName", e.target.value)}
					onBlur={() => validateField("firstName")}
					error={fieldError("firstName")}
					required
					disabled={saving}
				/>
				<AuthFormField
					id="addr-lastName"
					label={t("lastName")}
					value={form.lastName}
					onChange={(e) => set("lastName", e.target.value)}
					onBlur={() => validateField("lastName")}
					error={fieldError("lastName")}
					required
					disabled={saving}
				/>
			</div>
			<AuthFormField
				id="addr-street1"
				label={t("streetAddress1")}
				value={form.streetAddress1}
				onChange={(e) => set("streetAddress1", e.target.value)}
				onBlur={() => validateField("streetAddress1")}
				error={fieldError("streetAddress1")}
				required
				disabled={saving}
			/>
			<AuthFormField
				id="addr-street2"
				label={t("streetAddress2")}
				value={form.streetAddress2}
				onChange={(e) => set("streetAddress2", e.target.value)}
				disabled={saving}
			/>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<AuthFormField
					id="addr-city"
					label={t("city")}
					value={form.city}
					onChange={(e) => set("city", e.target.value)}
					onBlur={() => validateField("city")}
					error={fieldError("city")}
					required
					disabled={saving}
				/>
				<AuthFormField
					id="addr-postal"
					label={t("postalCode")}
					value={form.postalCode}
					onChange={(e) => set("postalCode", e.target.value)}
					disabled={saving}
				/>
			</div>
			{form.country === "AE" && (
				<div className="flex flex-col gap-1.5">
					<label htmlFor="addr-emirate" className="text-sm font-medium text-content-primary">
						{t("emirate")}
						<span className={authRequiredMarkClassName} aria-hidden="true">
							*
						</span>
					</label>
					{/* Value is Saleor's `raw` country area — the same value the checkout saves
					    (see toCountryAreaOptions). A stored value Saleor no longer lists is kept
					    as its own option so editing an old address never silently drops it. */}
					<select
						id="addr-emirate"
						value={form.countryArea}
						onChange={(e) => set("countryArea", e.target.value)}
						onBlur={() => validateField("countryArea")}
						required
						disabled={saving}
						aria-invalid={emirateError ? "true" : undefined}
						aria-describedby={emirateError ? "addr-emirate-error" : undefined}
						className={clsx(
							authInputClassName(Boolean(emirateError)),
							"w-full bg-no-repeat pe-9 ps-3.5",
							"bg-[length:1.1em_1.1em] bg-[right_0.75rem_center] rtl:bg-[left_0.75rem_center]",
						)}
					>
						<option value="" disabled>
							{t("selectEmirate")}
						</option>
						{form.countryArea && !emirateOptions.some((o) => o.value === form.countryArea) && (
							<option value={form.countryArea}>{form.countryArea}</option>
						)}
						{emirateOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					{emirateError && (
						<p id="addr-emirate-error" role="alert" className={authFieldErrorClassName}>
							{emirateError}
						</p>
					)}
				</div>
			)}
			<AuthFormField
				id="addr-phone"
				label={t("phone")}
				type="tel"
				value={form.phone}
				onChange={(e) => set("phone", e.target.value)}
				disabled={saving}
			/>
			<div className="flex flex-col gap-2">
				<label className="flex items-center gap-2 text-sm text-content-primary">
					<input
						type="checkbox"
						checked={form.setShipping}
						onChange={(e) => set("setShipping", e.target.checked)}
						disabled={saving}
						className="rounded"
					/>
					{t("setDefaultShipping")}
				</label>
				<label className="flex items-center gap-2 text-sm text-content-primary">
					<input
						type="checkbox"
						checked={form.setBilling}
						onChange={(e) => set("setBilling", e.target.checked)}
						disabled={saving}
						className="rounded"
					/>
					{t("setDefaultBilling")}
				</label>
			</div>
			<div className="flex gap-3">
				<button
					type="submit"
					disabled={saving}
					className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
				>
					{saving ? t("saving") : t("saveChanges")}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={saving}
					className="rounded-xl bg-surface-base px-5 py-2.5 text-sm font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
				>
					{t("cancel")}
				</button>
			</div>
		</form>
	);
}

function AddressCard({
	address,
	onEdit,
	onDelete,
	onSetDefault,
}: {
	address: Address;
	onEdit: () => void;
	onDelete: () => void;
	onSetDefault: (type: AddressTypeEnum) => void;
}) {
	const t = useTranslations("account");
	const [confirming, setConfirming] = useState(false);

	return (
		<div className="flex flex-col gap-3 rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle">
			{/* Badges */}
			<div className="flex flex-wrap gap-1.5">
				{address.isDefaultShippingAddress && (
					<span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-content-inverse">
						{t("defaultShipping")}
					</span>
				)}
				{address.isDefaultBillingAddress && (
					<span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-content-secondary ring-1 ring-line-subtle">
						{t("defaultBilling")}
					</span>
				)}
			</div>

			{/* Address lines */}
			<div className="text-sm text-content-primary">
				<p className="font-medium">
					{address.firstName} {address.lastName}
				</p>
				<p className="text-content-secondary">{address.streetAddress1}</p>
				{address.streetAddress2 && <p className="text-content-secondary">{address.streetAddress2}</p>}
				<p className="text-content-secondary">
					{address.city}
					{address.postalCode ? `, ${address.postalCode}` : ""} · {address.country.country}
				</p>
				{address.phone && <p className="text-content-secondary">{address.phone}</p>}
			</div>

			{/* Actions */}
			{confirming ? (
				<div className="flex items-center gap-3">
					<p className="text-sm text-content-secondary">{t("confirmDelete")}</p>
					<button
						type="button"
						onClick={() => {
							setConfirming(false);
							onDelete();
						}}
						className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
					>
						{t("confirm")}
					</button>
					<button
						type="button"
						onClick={() => setConfirming(false)}
						className="text-xs text-content-secondary hover:text-content-primary"
					>
						{t("cancel")}
					</button>
				</div>
			) : (
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
					>
						<Pencil className="h-3.5 w-3.5" aria-hidden="true" />
						{t("editAddress")}
					</button>
					{!address.isDefaultShippingAddress && (
						<button
							type="button"
							onClick={() => onSetDefault("SHIPPING" as AddressTypeEnum)}
							className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
						>
							<Check className="h-3.5 w-3.5" aria-hidden="true" />
							{t("setDefaultShipping")}
						</button>
					)}
					{!address.isDefaultBillingAddress && (
						<button
							type="button"
							onClick={() => onSetDefault("BILLING" as AddressTypeEnum)}
							className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-content-secondary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
						>
							<Check className="h-3.5 w-3.5" aria-hidden="true" />
							{t("setDefaultBilling")}
						</button>
					)}
					<button
						type="button"
						onClick={() => setConfirming(true)}
						className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
					>
						<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
						{t("deleteAddress")}
					</button>
				</div>
			)}
		</div>
	);
}

export function AddressSection({ addresses, emirateOptions }: Props) {
	const t = useTranslations("account");
	const router = useRouter();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	// Failures of the card actions (delete / set default), which used to be ignored.
	const [listError, setListError] = useState<string | null>(null);

	async function handleSaveNew(form: AddressFormState) {
		setSaving(true);
		setFormError(null);
		try {
			const result = await createAddress({
				firstName: form.firstName,
				lastName: form.lastName,
				streetAddress1: form.streetAddress1,
				streetAddress2: form.streetAddress2,
				city: form.city,
				postalCode: form.postalCode,
				country: form.country as Parameters<typeof createAddress>[0]["country"],
				countryArea: form.countryArea,
				phone: form.phone,
			});
			if (!result.ok) {
				setFormError(resolveErrorMessage(t, result.error));
				return;
			}
			if (form.setShipping || form.setBilling) {
				// Set default after creation — handled by backend if we pass type to accountAddressCreate
				// For simplicity, setDefault after creation requires the new id which we don't have here
			}
			setShowAddForm(false);
			router.refresh();
		} catch {
			setFormError(t("errors.unknown"));
		} finally {
			setSaving(false);
		}
	}

	async function handleSaveEdit(id: string, form: AddressFormState) {
		setSaving(true);
		setFormError(null);
		try {
			const result = await updateAddress(id, {
				firstName: form.firstName,
				lastName: form.lastName,
				streetAddress1: form.streetAddress1,
				streetAddress2: form.streetAddress2,
				city: form.city,
				postalCode: form.postalCode,
				country: form.country as Parameters<typeof createAddress>[0]["country"],
				countryArea: form.countryArea,
				phone: form.phone,
			});
			if (!result.ok) {
				setFormError(resolveErrorMessage(t, result.error));
				return;
			}
			setEditingId(null);
			router.refresh();
		} catch {
			setFormError(t("errors.unknown"));
		} finally {
			setSaving(false);
		}
	}

	async function runCardAction(action: () => ReturnType<typeof deleteAddress>) {
		setListError(null);
		try {
			const result = await action();
			if (result.ok) router.refresh();
			else setListError(resolveErrorMessage(t, result.error));
		} catch {
			setListError(t("errors.unknown"));
		}
	}

	return (
		<div className="flex flex-col gap-4">
			{listError && (
				<p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
					{listError}
				</p>
			)}
			{/* Address cards grid */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{addresses.map((addr) => (
					<div key={addr.id}>
						{editingId === addr.id ? (
							<AnimatePresence initial={false}>
								<m.div
									key="edit-form"
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.25 }}
								>
									<AddressForm
										initial={addressToForm(addr)}
										onSave={(form) => handleSaveEdit(addr.id, form)}
										onCancel={() => {
											setEditingId(null);
											setFormError(null);
										}}
										saving={saving}
										error={formError}
										emirateOptions={emirateOptions}
										onEdit={() => setFormError(null)}
									/>
								</m.div>
							</AnimatePresence>
						) : (
							<AddressCard
								address={addr}
								onEdit={() => {
									setEditingId(addr.id);
									setShowAddForm(false);
									setFormError(null);
								}}
								onDelete={() => void runCardAction(() => deleteAddress(addr.id))}
								onSetDefault={(type) => void runCardAction(() => setDefaultAddress(addr.id, type))}
							/>
						)}
					</div>
				))}

				{/* Add new card */}
				{!showAddForm && (
					<button
						type="button"
						onClick={() => {
							setShowAddForm(true);
							setEditingId(null);
							setFormError(null);
						}}
						className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-subtle text-content-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
					>
						<Plus className="h-6 w-6" aria-hidden="true" />
						<span className="text-sm font-medium">{t("addAddress")}</span>
					</button>
				)}
			</div>

			{/* Add form — spans full width */}
			<AnimatePresence initial={false}>
				{showAddForm && (
					<m.div
						key="add-form"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.25 }}
						className="overflow-hidden"
					>
						<AddressForm
							initial={DEFAULT_FORM}
							onSave={handleSaveNew}
							onCancel={() => {
								setShowAddForm(false);
								setFormError(null);
							}}
							saving={saving}
							error={formError}
							emirateOptions={emirateOptions}
							onEdit={() => setFormError(null)}
						/>
					</m.div>
				)}
			</AnimatePresence>
		</div>
	);
}
