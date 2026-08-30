import { SupplierHero } from "@/ui/components/supplier/SupplierHero";
import { SupplierCategoriesSection } from "@/ui/components/supplier/SupplierCategoriesSection";
import { SupplierRequirementsSection } from "@/ui/components/supplier/SupplierRequirementsSection";
import { SupplierStepsSection } from "@/ui/components/supplier/SupplierStepsSection";
import { SupplierApplicationForm } from "@/ui/components/supplier/SupplierApplicationForm";
import { SupplierFaqSection } from "@/ui/components/supplier/SupplierFaqSection";
import { SupplierCtaSection } from "@/ui/components/supplier/SupplierCtaSection";

export function SupplierPageClient() {
	return (
		<main>
			<SupplierHero />
			<SupplierCategoriesSection />
			<SupplierRequirementsSection />
			<SupplierStepsSection />
			<SupplierApplicationForm />
			<SupplierFaqSection />
			<SupplierCtaSection />
		</main>
	);
}
