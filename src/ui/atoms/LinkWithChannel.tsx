"use client";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { type ComponentProps } from "react";

export const LinkWithChannel = ({
	href,
	...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) => {
	const { channel } = useParams<{ channel?: string }>();
	const locale = useLocale();

	if (!href.startsWith("/")) {
		return <Link {...props} href={href} />;
	}

	const encodedChannel = encodeURIComponent(channel ?? "");
	const hrefWithChannel = `/${locale}/${encodedChannel}${href}`;
	return <Link {...props} href={hrefWithChannel} />;
};
