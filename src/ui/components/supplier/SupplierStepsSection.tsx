import { getTranslations } from "next-intl/server";
import { Container } from "@/ui/components/Container";

export async function SupplierStepsSection() {
	const t = await getTranslations("supplier.steps");

	const steps = [
		{ num: 1, title: t("step1Title"), subtitle: t("step1Subtitle") },
		{ num: 2, title: t("step2Title"), subtitle: t("step2Subtitle") },
		{ num: 3, title: t("step3Title"), subtitle: t("step3Subtitle") },
		{ num: 4, title: t("step4Title"), subtitle: t("step4Subtitle") },
	];

	return (
		<section className="py-16 md:py-24">
			<Container>
				<h2 className="mb-14 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("sectionTitle")}
				</h2>

				{/* Mobile: vertical stepper */}
				<ol className="relative flex flex-col gap-0 md:hidden">
					{steps.map((step, i) => (
						<li key={step.num} className="relative flex gap-5 pb-10 last:pb-0">
							{i < steps.length - 1 && (
								<div className="absolute start-5 top-11 h-full w-0.5 -translate-x-1/2 bg-line-default rtl:translate-x-0 rtl:translate-x-1/2" />
							)}
							<div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white ring-4 ring-surface-base">
								{step.num}
							</div>
							<div className="pt-1.5">
								<h3 className="font-semibold text-content-primary">{step.title}</h3>
								<p className="mt-1 text-sm text-content-secondary">{step.subtitle}</p>
							</div>
						</li>
					))}
				</ol>

				{/* Desktop: horizontal timeline */}
				<ol className="relative hidden md:flex">
					<div className="absolute end-0 start-0 top-5 h-0.5 bg-line-default" />
					{steps.map((step) => (
						<li key={step.num} className="relative flex flex-1 flex-col items-center px-3 text-center">
							<div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white ring-4 ring-surface-base">
								{step.num}
							</div>
							<h3 className="text-sm font-semibold text-content-primary md:text-base">{step.title}</h3>
							<p className="mt-1 text-xs text-content-secondary md:text-sm">{step.subtitle}</p>
						</li>
					))}
				</ol>
			</Container>
		</section>
	);
}
