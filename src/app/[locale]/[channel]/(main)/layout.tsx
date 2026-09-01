import { type ReactNode } from "react";
import { Footer } from "@/ui/components/Footer";
import { Header } from "@/ui/components/Header";
import { HeaderWrapper } from "@/ui/components/HeaderWrapper";
import { TopBar } from "@/ui/components/nav/TopBar";
import { BottomNavClient } from "@/ui/components/nav/BottomNavClient";

export const metadata = {
	title: "Tawasi Plus",
	description:
		"Tawasi Plus Store is a leading online retailer offering a wide range of products like nuts, dried fruits, coffee, spices and more at competitive prices. Shop with confidence and enjoy fast shipping and excellent customer service.",
};

export default async function RootLayout(props: {
	children: ReactNode;
	params: Promise<{ locale: string; channel: string }>;
}) {
	const { locale, channel } = await props.params;
	return (
		<>
			<TopBar />
			<HeaderWrapper>
				<Header channel={channel} locale={locale} />
			</HeaderWrapper>
			{/* pt accounts for header (64px) + topbar (0 or 36px via CSS variable) */}
			{/* pb-16 md:pb-0 accounts for mobile bottom nav bar (64px) */}
			<div
				className="flex min-h-[calc(100dvh-64px)] flex-col pb-16 md:pb-0"
				style={{ paddingTop: "calc(64px + var(--topbar-height, 0px))" }}
			>
				<main className="flex-1">{props.children}</main>
				<Footer channel={channel} locale={locale} />
			</div>

			{/* Mobile bottom navigation bar — always available, no async dependency */}
			<BottomNavClient />
		</>
	);
}
