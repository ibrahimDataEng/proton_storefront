"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	id: string;
	label: string;
	error?: string;
}

/**
 * Shared look for every auth input (text fields here, and PhoneField's select +
 * inputs) so they can't drift apart again. Layout (width, flex, padding overrides)
 * stays with the caller.
 */
export function authInputClassName(hasError: boolean): string {
	return clsx(
		"rounded-lg border bg-surface-raised py-2.5 text-sm text-content-primary",
		"placeholder:text-content-secondary",
		"transition-colors focus:outline-none focus:ring-2",
		"disabled:cursor-not-allowed disabled:opacity-50",
		hasError
			? "border-status-danger focus:border-status-danger focus:ring-status-danger/30"
			: "border-line-default focus:border-brand-primary focus:ring-brand-primary/20",
	);
}

export const authRequiredMarkClassName = "ms-1 text-status-danger";
export const authFieldErrorClassName = "text-xs text-status-danger";

export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(function AuthFormField(
	{ id, label, error, className, ...inputProps },
	ref,
) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium text-content-primary">
				{label}
				{inputProps.required && (
					<span className={authRequiredMarkClassName} aria-hidden="true">
						*
					</span>
				)}
			</label>
			<input
				ref={ref}
				id={id}
				dir="auto"
				className={clsx("w-full px-3.5", authInputClassName(Boolean(error)), className)}
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={error ? "true" : undefined}
				{...inputProps}
			/>
			{error && (
				<p id={`${id}-error`} role="alert" className={authFieldErrorClassName}>
					{error}
				</p>
			)}
		</div>
	);
});
