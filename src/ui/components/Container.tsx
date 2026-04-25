import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
	size?: ContainerSize;
	as?: "div" | "section" | "article" | "main";
}

const sizeMap: Record<ContainerSize, string> = {
	sm: "max-w-3xl",
	md: "max-w-5xl",
	lg: "max-w-7xl",
	xl: "max-w-[90rem]",
	full: "max-w-none",
};

export function Container({ size = "lg", as: Tag = "div", className, children, ...rest }: ContainerProps) {
	return (
		<Tag className={clsx("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)} {...rest}>
			{children}
		</Tag>
	);
}
