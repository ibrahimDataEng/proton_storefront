"use client";

import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Calendar, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { type AccountSection } from "../AccountSidebar";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import type { CurrentUserOrderListQuery, OrderDetailsFragment } from "@/gql/graphql";

type UserWithOrders = NonNullable<CurrentUserOrderListQuery["me"]>;

interface Props {
	user: UserWithOrders;
	orders: OrderDetailsFragment[];
	onNavigate: (section: AccountSection) => void;
	locale: string;
}

function formatDate(dateStr: string, locale: string) {
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(dateStr));
}

function CardItem({
	icon,
	label,
	value,
	delay,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	delay: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay }}
			className="flex items-start gap-4 rounded-2xl bg-surface-base p-5 ring-1 ring-line-subtle"
		>
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-xs text-content-secondary">{label}</p>
				<p className="mt-0.5 truncate text-sm font-semibold text-content-primary">{value}</p>
			</div>
		</motion.div>
	);
}

export function OverviewSection({ user, orders, onNavigate, locale }: Props) {
	const t = useTranslations("account");

	const lastOrder = orders[0];
	const defaultShipping = user.addresses?.find((a) => a.isDefaultShippingAddress);

	const memberSince = user.dateJoined ? formatDate(user.dateJoined , locale) : "—";

	const lastOrderValue = lastOrder
		? `#${lastOrder.number} · ${formatDate(lastOrder.created , locale)}`
		: "—";

	const defaultAddressValue = defaultShipping
		? `${defaultShipping.streetAddress1}, ${defaultShipping.city}`
		: t("noAddress");

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<CardItem
					icon={<Package className="h-5 w-5" />}
					label={t("totalOrders")}
					value={String(orders.length)}
					delay={0}
				/>
				<CardItem
					icon={<ShoppingBag className="h-5 w-5" />}
					label={t("lastOrder")}
					value={lastOrderValue}
					delay={0.1}
				/>
				<CardItem
					icon={<MapPin className="h-5 w-5" />}
					label={t("defaultAddress")}
					value={defaultAddressValue}
					delay={0.2}
				/>
				<CardItem
					icon={<Calendar className="h-5 w-5" />}
					label={t("memberSince")}
					value={memberSince}
					delay={0.3}
				/>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4, duration: 0.3 }}
				className="flex flex-wrap gap-3"
			>
				<button
					type="button"
					onClick={() => onNavigate("orders")}
					className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90"
				>
					{t("orders")}
				</button>
				<button
					type="button"
					onClick={() => onNavigate("addresses")}
					className="rounded-xl bg-surface-base px-5 py-2.5 text-sm font-semibold text-content-primary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
				>
					{t("addresses")}
				</button>
				<LinkWithChannel
					href="/products"
					className="rounded-xl bg-surface-base px-5 py-2.5 text-sm font-semibold text-content-primary ring-1 ring-line-subtle transition-colors hover:bg-surface-sunken"
				>
					{t("shopNow")}
				</LinkWithChannel>
			</motion.div>
		</div>
	);
}
