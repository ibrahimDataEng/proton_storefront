import { Suspense } from "react";
import { MenuIcon } from "lucide-react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
import { SearchBar } from "./components/SearchBar";
import { MobileSearchTrigger } from "./components/MobileSearchTrigger";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { MobileDrawerWrapper } from "./MobileDrawerWrapper";

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

				{/* Mobile search icon */}
				<div className="flex lg:hidden">
					<MobileSearchTrigger channel={channel} locale={locale} />
				</div>

				<div>
					<LanguageSwitcher />
				</div>

				<Suspense fallback={<div className="w-8" />}>
					<UserMenuContainer />
				</Suspense>
			</div>

			{/* Cart — always visible */}
			<div className="flex items-center">
				<Suspense fallback={<div className="w-6" />}>
					<CartNavItem channel={channel} locale={locale} />
				</Suspense>
			</div>

			{/* Mobile drawer — fallback renders hamburger immediately while categories load */}
			<Suspense
				fallback={
					<button
						className="flex h-8 w-8 items-center justify-center self-center md:hidden"
						disabled
						aria-label="Open menu"
					>
						<MenuIcon className="h-6 w-6 shrink-0" aria-hidden />
					</button>
				}
			>
				<MobileDrawerWrapper locale={locale} />
			</Suspense>
		</nav>
	);
};
