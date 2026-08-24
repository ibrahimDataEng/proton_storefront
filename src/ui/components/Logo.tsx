import Image from "next/image";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

const companyName = "PROTON";

export const Logo = ({ className }: { className?: string }) => {
	return (
		<div className="flex shrink-0 items-center">
			<LinkWithChannel aria-label={`${companyName} — homepage`} href="/">
				<Image
					src="/logo.png"
					alt={companyName}
					width={140}
					height={56}
					className={className ?? ""}
					priority
				/>
			</LinkWithChannel>
		</div>
	);
};
