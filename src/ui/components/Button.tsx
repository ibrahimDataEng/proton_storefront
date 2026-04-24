"use client";

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { forwardRef ,type  ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: "bg-brand-primary text-content-inverse hover:bg-brand-primary/90 border border-transparent",
	secondary: "bg-surface-raised text-content-primary border border-line-default hover:bg-surface-sunken",
	ghost: "bg-transparent text-content-primary border border-transparent hover:bg-surface-sunken",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-sm",
	md: "h-11 px-5 text-base",
	lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = "primary", size = "md", loading = false, disabled, className, children, ...rest },
	ref,
) {
	const isDisabled = disabled || loading;

	return (
		<button
			ref={ref}
			disabled={isDisabled}
			className={clsx(
				"inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				variantClasses[variant],
				sizeClasses[size],
				className,
			)}
			{...rest}
		>
			{loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />}
			{children}
		</button>
	);
});
