"use client";

import { type Checkout } from "@/checkout/graphql";
import { useCheckoutMessages } from "@/checkout/lib/checkoutMessages";

const getCategorySuggestions = (checkout: Checkout, locale: string) => {
	const categoryMap = new Map<string, { slug: string; name: string }>();

	for (const line of checkout.lines) {
		const category = line.variant?.product.category;
		if (!category?.slug || categoryMap.has(category.slug)) {
			continue;
		}

		categoryMap.set(category.slug, {
			slug: category.slug,
			name: locale === "ar" && category.translation?.name ? category.translation.name : category.name,
		});
	}

	return Array.from(categoryMap.values()).slice(0, 4);
};

export const CheckoutDiscovery = ({ checkout }: { checkout: Checkout }) => {
	const { locale, discovery } = useCheckoutMessages();
	const categorySuggestions = getCategorySuggestions(checkout, locale);
	const storefrontHref = `/${locale}/${checkout.channel.slug}`;
	const continueShoppingHref = `${storefrontHref}/products`;

	return (
		<section className="lg:col-span-2">
			<div className="grid gap-4 rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-[#e8f5ee] p-4 shadow-sm lg:grid-cols-[minmax(0,1.6fr)_320px] lg:p-6">
				<div className="rounded-[1.5rem] bg-white/80 p-5 ring-1 ring-neutral-200/70 lg:p-6">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2d6a4f]">
							{discovery.eyebrow}
						</p>
						<h2 className="mt-2 text-2xl font-semibold text-neutral-900">{discovery.title}</h2>
						<p className="mt-2 text-sm text-neutral-600">{discovery.description}</p>
					</div>

					{categorySuggestions.length ? (
						<div className="mt-6">
							<p className="text-sm font-medium text-neutral-700">{discovery.similarCategories}</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								{categorySuggestions.map((category) => (
									<a
										key={category.slug}
										href={`${storefrontHref}/categories/${category.slug}`}
										className="inline-flex min-h-11 items-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
									>
										{category.name}
									</a>
								))}
							</div>
						</div>
					) : null}
				</div>

				<div className="flex h-full flex-col justify-between rounded-[1.5rem] bg-[#1a4a32] p-5 text-white shadow-sm lg:p-6">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9fcfb8]">
							{discovery.quickAction}
						</p>
						<h3 className="mt-3 text-xl font-semibold">{discovery.quickActionTitle}</h3>
						<p className="mt-2 text-sm leading-6 text-neutral-300">{discovery.quickActionDescription}</p>
					</div>
					<a
						href={continueShoppingHref}
						className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
					>
						{discovery.continueShopping}
					</a>
				</div>
			</div>
		</section>
	);
};
