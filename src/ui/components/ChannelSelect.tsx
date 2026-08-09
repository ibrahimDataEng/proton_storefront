"use client";

import { useParams, useRouter } from "next/navigation";

export const ChannelSelect = ({
	channels,
}: {
	channels: { id: string; name: string; slug: string; currencyCode: string }[];
}) => {
	const router = useRouter();
	const params = useParams<{ channel: string }>();

	return (
		<select
			className="h-10 w-fit rounded-md border border-line-default bg-surface-raised px-4 py-2 pr-10 text-sm placeholder:text-content-secondary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
			onChange={(e) => {
				const newChannel = e.currentTarget.value;
				return router.push(`/${newChannel}`);
			}}
			value={params.channel}
		>
			{channels.map((channel) => (
				<option key={channel.id} value={channel.slug}>
					{channel.currencyCode}
				</option>
			))}
		</select>
	);
};
