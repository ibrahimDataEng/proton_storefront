"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
export function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();

	return (
		<div className="flex gap-2">
			<Link href={pathname} locale="en" className={locale === "en" ? "font-bold underline" : ""}>
				EN
			</Link>
			<span>|</span>
			<Link href={pathname} locale="ar" className={locale === "ar" ? "font-bold underline" : ""}>
				AR
			</Link>
		</div>
	);
}
