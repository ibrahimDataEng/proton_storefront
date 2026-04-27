"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteLineFromCheckout } from "./actions";

type Props = {
	lineId: string;
	checkoutId: string;
};

export const DeleteLineButton = ({ lineId, checkoutId }: Props) => {
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("cart");

	return (
		<button
			type="button"
			title={isPending ? t("removing") : t("remove")}
			aria-label={isPending ? t("removing") : t("remove")}
			aria-disabled={isPending}
			className="text-content-secondary transition-colors hover:text-status-danger disabled:cursor-not-allowed"
			onClick={() => {
				if (isPending) return;
				startTransition(() => deleteLineFromCheckout({ lineId, checkoutId }));
			}}
		>
			{isPending ? (
				<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
			) : (
				<Trash2 size={18} aria-hidden="true" />
			)}
			<span className="sr-only">{isPending ? t("removing") : t("remove")}</span>
		</button>
	);
};
