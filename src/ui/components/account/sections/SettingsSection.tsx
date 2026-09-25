"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Download, Trash2 } from "lucide-react";
import { AuthFormField } from "@/ui/components/auth/AuthFormField";
import { ChangePasswordForm } from "@/ui/components/auth/ChangePasswordForm";
import {
	PhoneField,
	EMPTY_PHONE_VALUES,
	combinePhone,
	validatePhoneFields,
	type PhoneFieldValues,
} from "@/ui/components/auth/PhoneField";
import { DeleteAccountModal } from "@/ui/components/account/DeleteAccountModal";
import { updateAccount } from "@/app/[locale]/[channel]/(main)/account/actions";
import type { CurrentUserOrderListQuery } from "@/gql/graphql";
import { resolveErrorMessage } from "@/lib/i18n/resolveErrorMessage";

type PhoneLoadState = "loading" | "loaded" | "error";
type PhoneSubmitOutcome = "invalid" | "conflict" | "service_error" | null;

type UserData = NonNullable<CurrentUserOrderListQuery["me"]>;

interface Props {
	user: UserData;
}

export function SettingsSection({ user }: Props) {
	const t = useTranslations("account");
	const tAuth = useTranslations("auth");
	const tPhoneField = useTranslations("phoneField");
	const tDelete = useTranslations("accountDeletion");
	const router = useRouter();

	const [firstName, setFirstName] = useState(user.firstName ?? "");
	const [lastName, setLastName] = useState(user.lastName ?? "");
	const [saving, setSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Phone view/edit — a deliberate, narrow exception to phone-status's PII-minimization
	// design (see CLAUDE.md's "Mandatory Phone Number" section): this is the one place the
	// storefront ever displays the actual stored number, gated entirely by the caller's own
	// session (get-phone/set-phone both resolve userId server-side, never from the client).
	const [phone, setPhone] = useState<string | null>(null);
	const [phoneLoadState, setPhoneLoadState] = useState<PhoneLoadState>("loading");
	const [editingPhone, setEditingPhone] = useState(false);
	const [phoneValues, setPhoneValues] = useState<PhoneFieldValues>(EMPTY_PHONE_VALUES);
	const [phoneFieldError, setPhoneFieldError] = useState<string | undefined>();
	const [phoneOutcome, setPhoneOutcome] = useState<PhoneSubmitOutcome>(null);
	const [savingPhone, setSavingPhone] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch("/api/identity/get-phone");
				const data = (await res.json().catch(() => null)) as {
					outcome?: string;
					phone?: string | null;
				} | null;
				if (cancelled) return;
				if (res.ok && data?.outcome === "success") {
					setPhone(data.phone ?? null);
					setPhoneLoadState("loaded");
				} else {
					setPhoneLoadState("error");
				}
			} catch {
				if (!cancelled) setPhoneLoadState("error");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	function handleEditPhone() {
		setEditingPhone(true);
		// Starts blank rather than trying to re-split the existing E.164 value back into a
		// country code + local number — the same choice RegisterForm/PhoneGate already make
		// for every phone entry point in this codebase (none of them pre-fill either), and
		// set-phone is an upsert regardless, so a fresh submit correctly replaces the old value.
		setPhoneValues(EMPTY_PHONE_VALUES);
		setPhoneFieldError(undefined);
		setPhoneOutcome(null);
	}

	async function handleSavePhone(e: React.FormEvent) {
		e.preventDefault();
		const validation = validatePhoneFields(phoneValues);
		if (validation) {
			setPhoneFieldError(validation === "required" ? tPhoneField("required") : tPhoneField("invalid"));
			return;
		}
		setPhoneFieldError(undefined);
		setPhoneOutcome(null);
		setSavingPhone(true);

		try {
			const combined = combinePhone(phoneValues);
			const res = await fetch("/api/identity/set-phone", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone: combined }),
			});
			const data = (await res.json().catch(() => null)) as { outcome?: string } | null;

			if (res.ok && data?.outcome === "success") {
				setPhone(combined);
				setPhoneLoadState("loaded");
				setEditingPhone(false);
				return;
			}
			if (data?.outcome === "invalid") setPhoneOutcome("invalid");
			else if (data?.outcome === "conflict") setPhoneOutcome("conflict");
			else setPhoneOutcome("service_error");
		} catch {
			setPhoneOutcome("service_error");
		} finally {
			setSavingPhone(false);
		}
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setSaveStatus("idle");
		setSaveError(null);
		try {
			const result = await updateAccount({ firstName, lastName });
			if (!result.ok) {
				setSaveError(resolveErrorMessage(t, result.error));
				setSaveStatus("error");
				return;
			}
			setSaveStatus("success");
			router.refresh();
			setTimeout(() => setSaveStatus("idle"), 2500);
		} catch {
			setSaveError(t("errors.unknown"));
			setSaveStatus("error");
		} finally {
			setSaving(false);
		}
	}

	function handleDownloadData() {
		const orders = user.orders?.edges.map((edge) => edge.node) ?? [];

		const data = {
			exportedAt: new Date().toISOString(),
			account: {
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				dateJoined: user.dateJoined,
			},
			orders: orders.map((order) => ({
				number: order.number,
				date: order.created,
				status: order.status,
				total: order.total?.gross,
				items: order.lines.map((line) => ({
					product: line.variant?.product?.name,
					variant: line.variant?.name,
					quantity: line.quantity,
					price: line.variant?.pricing?.price?.gross,
				})),
			})),
			addresses: user.addresses ?? [],
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `tawasi-plus-my-data-${new Date().toISOString().slice(0, 10)}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Personal info card */}
			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-5 text-base font-semibold text-content-primary">{t("personalInfo")}</h2>
				<form onSubmit={handleSave} className="flex flex-col gap-4">
					{saveError && (
						<p role="alert" className="rounded-md bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
							{saveError}
						</p>
					)}
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<AuthFormField
							id="settings-firstName"
							label={tAuth("firstName")}
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							disabled={saving}
						/>
						<AuthFormField
							id="settings-lastName"
							label={tAuth("lastName")}
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							disabled={saving}
						/>
					</div>
					<AuthFormField
						id="settings-email"
						label={tAuth("email")}
						type="email"
						value={user.email}
						readOnly
						disabled
						className="cursor-not-allowed opacity-60"
					/>
					<div className="flex items-center gap-3">
						<button
							type="submit"
							disabled={saving}
							className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
						>
							{saveStatus === "success" ? (
								<>
									<Check className="h-4 w-4" aria-hidden="true" />
									{t("saved")}
								</>
							) : (
								t("saveChanges")
							)}
						</button>
					</div>
				</form>

				<div className="mt-4">
					<span className="mb-1.5 block text-sm font-medium text-content-primary">{t("phoneNumber")}</span>
					{!editingPhone ? (
						<div className="flex items-center justify-between gap-3 rounded-lg border border-line-default bg-surface-sunken px-4 py-3">
							<span className="text-sm text-content-primary" dir="ltr">
								{phoneLoadState === "loading"
									? "…"
									: phoneLoadState === "error"
										? t("phoneLoadError")
										: phone ?? t("phoneNotSet")}
							</span>
							<button
								type="button"
								onClick={handleEditPhone}
								className="shrink-0 text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
							>
								{t("editPhone")}
							</button>
						</div>
					) : (
						<form
							onSubmit={handleSavePhone}
							noValidate
							className="flex flex-col gap-3 rounded-lg border border-line-default p-4"
						>
							<PhoneField
								id="settings-phone"
								values={phoneValues}
								onChange={setPhoneValues}
								error={phoneFieldError}
								required
							/>
							{phoneOutcome === "invalid" && (
								<p role="alert" className="text-sm text-red-600">
									{t("phoneInvalid")}
								</p>
							)}
							{phoneOutcome === "conflict" && (
								<p role="alert" className="text-sm text-red-600">
									{t("phoneConflict")}
								</p>
							)}
							{phoneOutcome === "service_error" && (
								<p role="alert" className="text-sm text-status-warning">
									{t("phoneServiceError")}
								</p>
							)}
							<div className="flex items-center gap-3">
								<button
									type="submit"
									disabled={savingPhone}
									className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
								>
									{t("saveChanges")}
								</button>
								<button
									type="button"
									disabled={savingPhone}
									onClick={() => setEditingPhone(false)}
									className="text-sm text-content-secondary underline-offset-2 hover:underline disabled:opacity-60"
								>
									{t("cancel")}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>

			{/* Security card */}
			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-5 text-base font-semibold text-content-primary">{t("security")}</h2>
				<ChangePasswordForm />
			</div>

			{/* Download your data — non-destructive courtesy export */}
			<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-1 text-base font-semibold text-content-primary">{t("downloadDataTitle")}</h2>
				<p className="mb-5 text-sm text-content-secondary">{t("downloadDataSubtitle")}</p>
				<button
					type="button"
					onClick={handleDownloadData}
					className="flex items-center gap-2 rounded-xl bg-surface-base px-5 py-2.5 text-sm font-semibold text-content-primary ring-1 ring-line-default transition-colors hover:bg-surface-sunken"
				>
					<Download className="h-4 w-4" aria-hidden="true" />
					{t("downloadDataButton")}
				</button>
			</div>

			{/* Delete account — visually separated destructive block */}
			<div className="rounded-2xl border-t-2 border-status-danger/40 bg-surface-base p-6 ring-1 ring-line-subtle">
				<h2 className="mb-1 text-base font-semibold text-status-danger">{tDelete("sectionTitle")}</h2>
				<p className="mb-5 text-sm text-content-secondary">{tDelete("sectionSubtitle")}</p>
				<button
					type="button"
					onClick={() => setIsDeleteModalOpen(true)}
					className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-status-danger ring-1 ring-status-danger/40 transition-colors hover:bg-status-danger/10"
				>
					<Trash2 className="h-4 w-4" aria-hidden="true" />
					{tDelete("deleteButton")}
				</button>
			</div>

			<DeleteAccountModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				email={user.email}
			/>
		</div>
	);
}
