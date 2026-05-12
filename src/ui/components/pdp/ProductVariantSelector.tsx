"use client";

import { useTranslations } from "next-intl";
import { m } from "framer-motion";
import { clsx } from "clsx";

interface Variant {
	id: string;
	name: string;
	translation?: { name: string } | null;
	quantityAvailable?: number | null;
	pricing?: {
		price?: { gross: { amount: number; currency: string } } | null;
		priceUndiscounted?: { gross: { amount: number; currency: string } } | null;
	} | null;
}

interface Props {
	variants: readonly Variant[];
	selectedVariantId: string | undefined;
	onVariantChange: (id: string) => void;
}

export function ProductVariantSelector({ variants, selectedVariantId, onVariantChange }: Props) {
	const t = useTranslations("products");

	if (variants.length <= 1) return null;

	const selectedVariant = variants.find((v) => v.id === selectedVariantId);
	const lowStock =
		selectedVariant &&
		selectedVariant.quantityAvailable !== null &&
		selectedVariant.quantityAvailable !== undefined &&
		selectedVariant.quantityAvailable <= 5 &&
		selectedVariant.quantityAvailable > 0;

	return (
		<fieldset className="mb-4">
			<legend className="mb-2 text-sm font-medium text-content-secondary">{t("selectSize")}</legend>
			<div className="flex flex-wrap gap-2" role="radiogroup">
				{variants.map((variant) => {
					const isOos =
						variant.quantityAvailable === 0 ||
						variant.quantityAvailable === null ||
						variant.quantityAvailable === undefined;
					const isSelected = selectedVariantId === variant.id;
					const displayName = variant.translation?.name ?? variant.name;

					return (
						<m.button
							key={variant.id}
							type="button"
							role="radio"
							aria-checked={isSelected}
							disabled={isOos}
							whileTap={isOos ? undefined : { scale: 0.95 }}
							onClick={() => !isOos && onVariantChange(variant.id)}
							className={clsx(
								"relative min-w-[5ch] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
								isSelected
									? "border-transparent bg-brand-primary text-content-inverse"
									: "border-line-subtle bg-surface-sunken text-content-primary hover:bg-surface-raised",
								isOos && "cursor-not-allowed opacity-40",
							)}
						>
							{isOos ? <s>{displayName}</s> : displayName}
						</m.button>
					);
				})}
			</div>
			{lowStock && (
				<p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
					{t("onlyLeft", { count: selectedVariant.quantityAvailable ?? 0 })}
				</p>
			)}
		</fieldset>
	);
}
