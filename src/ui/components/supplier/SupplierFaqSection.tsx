"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { Container } from "@/ui/components/Container";

export function SupplierFaqSection() {
	const t = useTranslations("supplier.faq");
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const faqs = [
		{ q: t("q1"), a: t("a1") },
		{ q: t("q2"), a: t("a2") },
		{ q: t("q3"), a: t("a3") },
		{ q: t("q4"), a: t("a4") },
	];

	return (
		<section className="bg-surface-raised py-16 md:py-24">
			<Container>
				<h2 className="mb-10 text-center text-3xl font-bold text-content-primary md:text-4xl">
					{t("sectionTitle")}
				</h2>

				<div className="mx-auto max-w-2xl divide-y divide-line-subtle">
					{faqs.map((faq, i) => (
						<div key={i}>
							<button
								onClick={() => setOpenIndex(openIndex === i ? null : i)}
								aria-expanded={openIndex === i}
								className="flex w-full items-center justify-between gap-4 py-5 text-start"
							>
								<span className="font-medium text-content-primary">{faq.q}</span>
								<m.span
									animate={{ rotate: openIndex === i ? 45 : 0 }}
									transition={{ type: "spring", stiffness: 320, damping: 22 }}
									className="shrink-0 text-2xl font-light leading-none text-brand-primary"
									aria-hidden="true"
								>
									+
								</m.span>
							</button>

							<AnimatePresence initial={false}>
								{openIndex === i && (
									<m.div
										key="answer"
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.24, ease: "easeInOut" }}
										className="overflow-hidden"
									>
										<p className="pb-5 leading-relaxed text-content-secondary">{faq.a}</p>
									</m.div>
								)}
							</AnimatePresence>
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}
