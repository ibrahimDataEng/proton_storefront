import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";

export function Header({ channel, locale }: { channel: string; locale: string }) {
	return (
		<div className="mx-auto h-full max-w-7xl px-3 sm:px-8">
			<div className="flex h-full justify-between gap-4 md:gap-8">
				<Logo />
				<Nav channel={channel} locale={locale} />
			</div>
		</div>
	);
}
