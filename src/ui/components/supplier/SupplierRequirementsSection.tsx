import { getTranslations } from "next-intl/server";
import { ShieldCheck, PackageCheck, FlaskConical, FileCheck2 } from "lucide-react";
import { Container } from "@/ui/components/Container";

export async function SupplierRequirementsSection() {
	const t = await getTranslations("supplier.requirements");

	const cards = [
		{ icon: ShieldCheck, title: t("card1Title"), subtitle: t("card1Subtitle") },
		{ icon: PackageCheck, title: t("card2Title"), subtitle: t("card2Subtitle") },
		{ icon: FlaskConical, title: t("card3Title"), subtitle: t("card3Subtitle") },
		{ icon: FileCheck2, title: t("card4Title"), subtitle: t("card4Subtitle") },
	];

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold text-content-primary md:text-4xl">{t("sectionTitle")}</h2>
					<p className="mt-3 text-content-secondary">{t("sectionSubtitle")}</p>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					{cards.map((card, i) => {
						const Icon = card.icon;
						return (
							<div
								key={i}
								className="group relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-base p-6 shadow-soft transition-shadow hover:border-brand-primary/40 hover:shadow-raised"
							>
								<div className="absolute inset-y-0 start-0 w-1 origin-center scale-y-0 rounded-s-2xl bg-brand-primary transition-transform duration-200 group-hover:scale-y-100" />
								<div className="ps-2">
									<div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
										<Icon className="h-5 w-5" />
									</div>
									<h3 className="mt-4 text-xl font-semibold text-content-primary">{card.title}</h3>
									<p className="mt-1.5 text-sm text-content-secondary">{card.subtitle}</p>
								</div>
							</div>
						);
					})}
				</div>
			</Container>
		</section>
	);
}
