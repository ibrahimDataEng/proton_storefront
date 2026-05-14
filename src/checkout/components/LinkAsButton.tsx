import { type ReactNode, type AnchorHTMLAttributes } from "react";
import clsx from "clsx";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	href: string;
	variant?: "primary" | "secondary" | "tertiary";
};

export const LinkAsButton = ({ children, href, variant = "primary" }: Props) => {
	const classes = clsx(
		"inline-flex h-10 items-center justify-center whitespace-nowrap rounded border active:outline-none font-bold transition-colors duration-200",
		{
			"bg-[#2d6a4f] hover:bg-[#235c43] disabled:bg-[#235c43] text-white px-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 hover:aria-disabled:bg-[#235c43] focus-visible:ring-2 focus-visible:ring-[#2d6a4f] focus-visible:ring-offset-2":
				variant === "primary",
			"border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#e8f5ee] active:bg-[#e8f5ee] disabled:border-neutral-300 aria-disabled:border-neutral-300 bg-transparent disabled:bg-transparent aria-disabled:bg-transparent px-4":
				variant === "secondary",
			"h-auto border-none bg-transparent p-0": variant === "tertiary",
		},
	);

	return (
		<a href={href} className={classes}>
			{children}
		</a>
	);
};
