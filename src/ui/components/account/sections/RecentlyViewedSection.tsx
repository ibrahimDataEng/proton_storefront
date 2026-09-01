"use client";

import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { EmptyState } from "@/ui/components/EmptyState";
import { ProductElement } from "@/ui/components/ProductElement";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import type { ProductListItemFragment } from "@/gql/graphql";

interface Props {
	products: ProductListItemFragment[];
}

export function RecentlyViewedSection({ products }: Props) {
	const t = useTranslations("recentlyViewed");
	const tAccount = useTranslations("account");

	if (products.length === 0) {
		return (
			<EmptyState
				icon={<History className="h-12 w-12" />}
				title={t("emptyTitle")}
				subtitle={t("emptySubtitle")}
				action={
					<LinkWithChannel
						href="/products"
						className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-primary/90"
					>
						{tAccount("shopNow")}
					</LinkWithChannel>
				}
			/>
		);
	}

	return (
		<ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{products.map((product, i) => (
				<ProductElement
					key={product.id}
					product={product}
					loading={i === 0 ? "eager" : "lazy"}
					priority={i === 0}
				/>
			))}
		</ul>
	);
}
