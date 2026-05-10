import { Suspense } from "react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
import { SearchBar } from "./components/SearchBar";
import { MobileSearchTrigger } from "./components/MobileSearchTrigger";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export const Nav = ({ channel, locale }: { channel: string; locale: string }) => {
	return (
		<nav className="flex w-full gap-4 lg:gap-6" aria-label="Main navigation">
			{/* Desktop nav links — hidden on mobile */}
			<ul className="hidden gap-4 overflow-x-auto whitespace-nowrap md:flex lg:gap-8 lg:px-0">
				<NavLinks channel={channel} locale={locale} />
			</ul>

			{/* Right-side utilities */}
			<div className="ml-auto flex items-center justify-center gap-4 whitespace-nowrap lg:gap-8">
				{/* Desktop search */}
				<div className="hidden lg:flex lg:w-80">
					<SearchBar channel={channel} locale={locale} />
				</div>

				{/* Mobile search icon — visible on mobile, hidden on lg+ */}
				<div className="flex lg:hidden">
					<MobileSearchTrigger channel={channel} locale={locale} />
				</div>

				{/* Language switcher — hidden on mobile (available in MobileDrawer) */}
				<div className="hidden md:block">
					<LanguageSwitcher />
				</div>

				{/* User menu — hidden on mobile (account in bottom bar) */}
				<div className="hidden md:block">
					<Suspense fallback={<div className="w-8" />}>
						<UserMenuContainer />
					</Suspense>
				</div>
			</div>

			{/* Cart — hidden on mobile (cart in bottom bar) */}
			<div className="hidden md:flex md:items-center">
				<Suspense fallback={<div className="w-6" />}>
					<CartNavItem channel={channel} locale={locale} />
				</Suspense>
			</div>
		</nav>
	);
};
