"use client";

import { usePathname } from "next/navigation";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

const companyName = "Gl Group";

export const Logo = ({ className }: { className?: string }) => {
	const pathname = usePathname();

	if (pathname === "/") {
		return (
			<h1
				className={`flex shrink-0 items-center font-bold text-content-primary ${className ?? ""}`}
				aria-label="homepage"
			>
				{companyName}
			</h1>
		);
	}
	return (
		<div className="flex shrink-0 items-center font-bold text-content-primary">
			<LinkWithChannel aria-label="homepage" href="/">
				<img
					src="/logo.png"
					alt={companyName}
					width={150}
					height={60}
					className={`mt-2 ${className ?? ""}`}
				/>
			</LinkWithChannel>
		</div>
	);
};
