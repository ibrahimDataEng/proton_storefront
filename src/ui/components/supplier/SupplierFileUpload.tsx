"use client";

import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { clsx } from "clsx";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip", ".jpg", ".jpeg", ".png"];
const ACCEPTED_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/zip",
	"application/x-zip-compressed",
	"image/jpeg",
	"image/png",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface SupplierFileUploadProps {
	file: File | null;
	onChange: (file: File | null) => void;
	error: string | null;
	onError: (error: string | null) => void;
}

function isAcceptedFile(file: File): boolean {
	if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
	const name = file.name.toLowerCase();
	return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function SupplierFileUpload({ file, onChange, error, onError }: SupplierFileUploadProps) {
	const t = useTranslations("supplier.form");
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const validateAndSet = (candidate: File) => {
		if (!isAcceptedFile(candidate)) {
			onError(t("uploadErrorType"));
			return;
		}
		if (candidate.size > MAX_FILE_SIZE) {
			onError(t("uploadErrorSize"));
			return;
		}
		onError(null);
		onChange(candidate);
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		const dropped = e.dataTransfer.files?.[0];
		if (dropped) validateAndSet(dropped);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0];
		if (selected) validateAndSet(selected);
	};

	const removeFile = () => {
		onChange(null);
		onError(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	return (
		<div>
			{file ? (
				<div className="flex items-center justify-between gap-3 rounded-lg border border-line-default bg-surface-base px-4 py-3">
					<div className="flex min-w-0 items-center gap-3">
						<FileIcon className="h-5 w-5 shrink-0 text-brand-primary" />
						<span className="truncate text-sm text-content-primary">{file.name}</span>
					</div>
					<button
						type="button"
						onClick={removeFile}
						aria-label={t("uploadRemove")}
						className="shrink-0 rounded-full p-1 text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content-primary"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			) : (
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={handleDrop}
					onClick={() => inputRef.current?.click()}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
					}}
					className={clsx(
						"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
						isDragging
							? "border-brand-primary bg-brand-primary/5"
							: "border-line-default bg-surface-base hover:border-brand-primary/40",
					)}
				>
					<UploadCloud className="h-7 w-7 text-content-secondary" />
					<p className="text-sm font-medium text-content-primary">{t("uploadDragText")}</p>
					<p className="text-xs text-content-secondary">
						{t("uploadOr")}{" "}
						<span className="font-medium text-brand-primary underline">{t("uploadBrowseText")}</span>
					</p>
					<input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_EXTENSIONS.join(",")}
						onChange={handleInputChange}
						className="hidden"
					/>
				</div>
			)}
			<p className="mt-1.5 text-xs text-content-secondary">{t("uploadHint")}</p>
			{error && <p className="mt-1 text-xs text-red-500">{error}</p>}
		</div>
	);
}
