import { useTranslations } from "next-intl";
import { AuthBrandIllustration } from "./AuthBrandIllustration";
import { Logo } from "@/ui/components/Logo";

/**
 * Split-screen brand panel for the standalone /login and /register pages.
 * Renders as a compact header band on mobile (logo + tagline only) and expands
 * into the full illustrated panel from `lg` up — one component, two looks, so the
 * copy/logo never drift between breakpoints. Not used by AuthModal (see that
 * component's own, lighter treatment).
 */
export function AuthBrandPanel() {
	const t = useTranslations("auth");

	return (
		<div className="flex flex-col justify-center bg-brand-primary px-6 py-8 text-content-inverse lg:min-h-screen lg:px-16 lg:py-16">
			<div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 text-center lg:mx-0 lg:max-w-md lg:items-start lg:gap-6 lg:text-start">
				<Logo className="h-9 w-auto brightness-0 invert lg:h-12" />
				<div className="flex flex-col gap-1.5 lg:gap-3">
					<h1 className="text-lg font-semibold lg:text-3xl">{t("splitWelcomeTitle")}</h1>
					<p className="hidden text-sm text-content-inverse/80 lg:block lg:text-base">
						{t("splitWelcomeSubtitle")}
					</p>
				</div>
				<AuthBrandIllustration className="mt-4 hidden h-56 w-56 lg:block" />
			</div>
		</div>
	);
}
