import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import * as Checkout from "@/lib/checkout";
import { Container } from "@/ui/components/Container";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { CartLineItem } from "@/ui/components/cart/CartLineItem";
import { OrderSummary } from "@/ui/components/cart/OrderSummary";
import { CartRecommendations, CartRecommendationsSkeleton } from "@/ui/components/cart/CartRecommendations";
import { SavedForLater } from "@/ui/components/cart/SavedForLater";

export const metadata = {
	title: "Shopping Cart · Green Line Storefront",
};

export default async function Page(props: { params: Promise<{ channel: string; locale: string }> }) {
	const params = await props.params;
	const { channel, locale } = params;
	const t = await getTranslations("cart");

	const checkoutId = await Checkout.getIdFromCookies(channel);
	const checkout = await Checkout.find(checkoutId, locale);

	if (!checkout || checkout.lines.length < 1) {
		return (
			<main className="min-h-[calc(100vh-4rem)] py-10">
				<Container>
					<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
						<ShoppingBag size={64} className="text-content-secondary" aria-hidden="true" />
						<h1 className="text-2xl font-semibold text-content-primary">{t("emptyTitle")}</h1>
						<p className="max-w-sm text-content-secondary">{t("emptySubtitle")}</p>
						<LinkWithChannel
							href="/"
							className="mt-2 inline-flex h-12 items-center justify-center rounded-md bg-brand-primary px-6 text-base font-medium text-content-inverse transition-colors hover:bg-brand-primary/90"
						>
							{t("exploreProducts")}
						</LinkWithChannel>
					</div>

					<SavedForLater channel={channel} />

					<Suspense fallback={<CartRecommendationsSkeleton />}>
						<CartRecommendations
							channel={channel}
							locale={locale}
							categorySlugs={[]}
							excludeProductIds={[]}
						/>
					</Suspense>
				</Container>
			</main>
		);
	}

	const categorySlugs = [
		...new Set(
			checkout.lines
				.map((line) => line.variant.product.category?.slug)
				.filter((slug): slug is string => Boolean(slug)),
		),
	];

	const cartProductIds = checkout.lines.map((line) => line.variant.product.id);

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<h1 className="mb-8 text-2xl font-semibold text-content-primary">{t("title")}</h1>

				<div className="grid gap-8 lg:grid-cols-12">
					{/* Cart lines */}
					<div className="lg:col-span-8">
						<div className="space-y-4" data-testid="CartProductList">
							{checkout.lines.map((line) => (
								<CartLineItem key={line.id} line={line} checkoutId={checkoutId} />
							))}
						</div>
					</div>

					{/* Order summary */}
					<div className="lg:col-span-4">
						<OrderSummary
							lines={checkout.lines}
							totalPrice={checkout.totalPrice.gross}
							checkoutId={checkoutId}
						/>
					</div>
				</div>

				<SavedForLater channel={channel} />

				<Suspense fallback={<CartRecommendationsSkeleton />}>
					<CartRecommendations
						channel={channel}
						locale={locale}
						categorySlugs={categorySlugs}
						excludeProductIds={cartProductIds}
					/>
				</Suspense>
			</Container>
		</main>
	);
}
