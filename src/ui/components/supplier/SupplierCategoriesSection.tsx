import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";

export async function SupplierCategoriesSection() {
	const t = await getTranslations("supplier.categories");

	const categories = [
		{ emoji: "🥜", name: t("nuts") },
		{ emoji: "🍇", name: t("driedFruits") },
		{ emoji: "🌰", name: t("seeds") },
		{ emoji: "☕", name: t("coffee") },
		{ emoji: "🧆", name: t("snacks") },
		{ emoji: "🌶️", name: t("spices") },
		{ emoji: "🌾", name: t("staples") },
		{ emoji: "🌿", name: t("herbs") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				<div className="mb-10 text-center">
					<h2 className="text-3xl font-bold text-content-primary md:text-4xl">{t("sectionTitle")}</h2>
					<p className="mt-3 text-content-secondary">{t("sectionSubtitle")}</p>
				</div>

				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{categories.map((category, i) => (
						<div
							key={i}
							className="flex flex-col items-center rounded-2xl border border-line-subtle bg-surface-raised p-5 shadow-soft transition-shadow hover:shadow-raised"
						>
							<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-primary/10">
								<span className="text-3xl" role="img" aria-hidden="true">
									{category.emoji}
								</span>
							</div>
							<p className="mt-3 text-center text-sm font-semibold text-content-primary">{category.name}</p>
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}
