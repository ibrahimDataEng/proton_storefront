"use client";

import { CourierOrderCard } from "./CourierOrderCard";
import { type CourierWorklistOrderFragment } from "@/gql/graphql";

type Props = {
	orders: CourierWorklistOrderFragment[];
	locale: string;
	channel: string;
};

export function CourierWorklist({ orders, locale, channel }: Props) {
	return (
		<ul className="flex flex-col gap-4">
			{orders.map((order) => (
				<li key={order.id}>
					<CourierOrderCard order={order} locale={locale} channel={channel} />
				</li>
			))}
		</ul>
	);
}
