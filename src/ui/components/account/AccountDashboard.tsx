"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AccountSidebar, type AccountSection } from "./AccountSidebar";
import { OverviewSection } from "./sections/OverviewSection";
import { OrdersSection } from "./sections/OrdersSection";
import { AddressSection } from "./sections/AddressSection";
import { SettingsSection } from "./sections/SettingsSection";
import type { CurrentUserOrderListQuery } from "@/gql/graphql";

type UserWithOrders = NonNullable<CurrentUserOrderListQuery["me"]>;

interface Props {
	user: UserWithOrders;
	locale: string;
}

export function AccountDashboard({ user, locale }: Props) {
	const t = useTranslations("account");
	const tAuth = useTranslations("auth");
	const [activeSection, setActiveSection] = useState<AccountSection>("overview");

	const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
	const initials =
		[user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
		user.email[0]?.toUpperCase() ||
		"U";

	const sidebarLabels = {
		overview: t("overview"),
		orders: t("orders"),
		addresses: t("addresses"),
		settings: t("settings"),
		signOut: tAuth("signOut"),
	};

	const orders = user.orders?.edges.map((e) => e.node) ?? [];
	const addresses = user.addresses ?? [];

	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
			<AccountSidebar
				initials={initials}
				fullName={fullName}
				email={user.email}
				activeSection={activeSection}
				onSectionChange={setActiveSection}
				labels={sidebarLabels}
			/>
			<main className="min-w-0 flex-1">
				{activeSection === "overview" && (
					<OverviewSection user={user} orders={orders} onNavigate={setActiveSection} locale={locale} />
				)}
				{activeSection === "orders" && <OrdersSection orders={orders} locale={locale} />}
				{activeSection === "addresses" && <AddressSection addresses={addresses} />}
				{activeSection === "settings" && <SettingsSection user={user} />}
			</main>
		</div>
	);
}
