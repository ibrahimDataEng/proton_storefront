import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";
import { MobileSearchBar } from "./nav/components/MobileSearchBar";
import { LanguageSwitcher } from "./nav/components/LanguageSwitcher";

export function Header({ channel, locale }: { channel: string; locale: string }) {
	return (
		<div className="mx-auto h-full max-w-7xl px-3 sm:px-8">
			{/* Mobile header (≤md): Logo + Search pill + Language switcher */}
			<div className="flex h-full items-center gap-3 md:hidden">
				<Logo />
				<div className="flex-1">
					<MobileSearchBar channel={channel} locale={locale} />
				</div>
				<LanguageSwitcher />
			</div>

			{/* Desktop/tablet header (≥md): Logo + Nav */}
			<div className="hidden h-full items-center justify-between gap-4 md:flex md:gap-8">
				<Logo />
				<Nav channel={channel} locale={locale} />
			</div>
		</div>
	);
}
