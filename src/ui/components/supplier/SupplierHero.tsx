import { getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/ui/components/Container";

const WHATSAPP_NUMBER = "971558711442";

export async function SupplierHero() {
	const t = await getTranslations("supplier.hero");
	const tCta = await getTranslations("supplier.cta");
	const locale = await getLocale();
	const waMessage = locale === "ar" ? tCta("waMessageAr") : tCta("waMessageEn");
	const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

	const stats = [
		{ value: t("stat1Value"), label: t("stat1Label") },
		{ value: t("stat2Value"), label: t("stat2Label") },
		{ value: t("stat3Value"), label: t("stat3Label") },
	];

	return (
		<section className="relative overflow-hidden bg-brand-primary py-20 md:py-28">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: "radial-gradient(ellipse at 50% -5%, rgba(255,255,255,0.09) 0%, transparent 62%)",
				}}
				aria-hidden="true"
			/>

			<Container className="relative z-10">
				<div className="text-center">
					<span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/15">
						{t("eyebrow")}
					</span>

					<h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
						{t("headline")}
					</h1>

					<p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
						{t("subtitle")}
					</p>

					<div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
						{stats.map((stat, i) => (
							<div
								key={i}
								className="rounded-2xl bg-white/10 px-3 py-5 ring-1 ring-white/10 backdrop-blur-sm"
							>
								<p className="text-2xl font-extrabold tabular-nums text-white md:text-3xl">{stat.value}</p>
								<p className="mt-1.5 text-xs font-medium text-white/70 md:text-sm">{stat.label}</p>
							</div>
						))}
					</div>

					<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<a
							href="#apply"
							className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-brand-primary shadow-lg transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						>
							{t("ctaApply")}
						</a>

						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:border-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						>
							{t("ctaWhatsApp")}
						</a>
					</div>
				</div>
			</Container>
		</section>
	);
}
