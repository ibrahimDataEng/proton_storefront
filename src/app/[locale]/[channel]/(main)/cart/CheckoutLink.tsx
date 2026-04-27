"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";

type Props = {
	disabled?: boolean;
	checkoutId?: string;
	className?: string;
};

export const CheckoutLink = ({ disabled, checkoutId, className }: Props) => {
	const t = useTranslations("cart");
	return (
		<a
			data-testid="CheckoutLink"
			aria-disabled={disabled}
			onClick={(e) => disabled && e.preventDefault()}
			href={`/checkout?checkout=${checkoutId}`}
			className={clsx(
				"inline-flex w-full items-center justify-center gap-2 rounded-md font-medium transition-colors",
				"h-12 px-6 text-base",
				"border border-transparent bg-brand-primary text-content-inverse hover:bg-brand-primary/90",
				"aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
				className,
			)}
		>
			{t("proceedToCheckout")}
		</a>
	);
};
