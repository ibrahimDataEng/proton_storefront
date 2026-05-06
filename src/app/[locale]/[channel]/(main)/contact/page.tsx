import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactPageClient } from "@/ui/components/contact/ContactPageClient";

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await props.params;
	const t = await getTranslations({ locale, namespace: "contact" });
	return {
		title: `${t("title")} · Green Line Group`,
		description: t("subtitle"),
	};
}

export default async function ContactPage() {
	return <ContactPageClient />;
}
