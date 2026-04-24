"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { deleteLineFromCheckout } from "./actions";

type Props = {
	lineId: string;
	checkoutId: string;
};

export const DeleteLineButton = ({ lineId, checkoutId }: Props) => {
	const [isPending, startTransition] = useTransition();
	const locale = useLocale();

	return (
		<button
			type="button"
			className="text-sm text-neutral-500 hover:text-neutral-900"
			onClick={() => {
				if (isPending) return;
				startTransition(() => deleteLineFromCheckout({ lineId, checkoutId }));
			}}
			aria-disabled={isPending}
		>
			{isPending ? (locale === "ar" ? "جار الإزالة" : "Removing") : locale === "ar" ? "إزالة" : "Remove"}
			<span className="sr-only">line from cart</span>
		</button>
	);
};
