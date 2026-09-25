export type CountryAreaChoice = { raw?: string | null; verbose?: string | null };
export type CountryAreaOption = { value: string; label: string };

const ARABIC_SCRIPT = /[؀-ۿ]/;

/**
 * Saleor's addressValidationRules returns each country-area choice once per label
 * language, all sharing the same `raw` value (AE: "Dubai" and "دبي" both ->
 * "إمارة دبيّ"). Keep one option per `raw`, labelled in the page's language when
 * both labels exist.
 *
 * The option VALUE is always `raw` — that's what the checkout's address form saves
 * (src/checkout/components/AddressForm/useAddressFormUtils.ts applies the same
 * rule; this is a deliberate re-implementation, the main app must not import from
 * src/checkout), so an address saved from /account is byte-identical to one saved
 * at checkout for the same emirate.
 */
export function toCountryAreaOptions(
	choices: readonly CountryAreaChoice[] | null | undefined,
	locale: string,
): CountryAreaOption[] {
	const byValue = new Map<string, CountryAreaChoice>();

	for (const choice of choices ?? []) {
		const key = choice.raw ?? choice.verbose ?? "";
		if (!key) continue;
		const existing = byValue.get(key);
		const isArabicLabel = ARABIC_SCRIPT.test(choice.verbose ?? "");
		const prefersThisLabel = locale === "ar" ? isArabicLabel : !isArabicLabel;

		if (!existing || (prefersThisLabel && ARABIC_SCRIPT.test(existing.verbose ?? "") !== isArabicLabel)) {
			byValue.set(key, choice);
		}
	}

	return [...byValue.entries()].map(([value, choice]) => ({ value, label: choice.verbose || value }));
}
