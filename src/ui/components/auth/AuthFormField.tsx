"use client";

import { type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	id: string;
	label: string;
	error?: string;
}

export function AuthFormField({ id, label, error, className, ...inputProps }: AuthFormFieldProps) {
	return (
		<div className="flex flex-col gap-1">
			<label htmlFor={id} className="text-sm font-medium text-content-primary">
				{label}
				{inputProps.required && (
					<span className="ms-1 text-red-500" aria-hidden="true">
						*
					</span>
				)}
			</label>
			<input
				id={id}
				dir="auto"
				className={clsx(
					"w-full rounded-md border border-line-default bg-surface-raised px-3 py-2 text-sm text-content-primary",
					"placeholder:text-content-secondary",
					"focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
					"disabled:cursor-not-allowed disabled:opacity-50",
					error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
					className,
				)}
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={error ? "true" : undefined}
				{...inputProps}
			/>
			{error && (
				<p id={`${id}-error`} role="alert" className="text-xs text-red-600">
					{error}
				</p>
			)}
		</div>
	);
}
