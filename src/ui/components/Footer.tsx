// components/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { ChannelsListDocument, LanguageCodeEnum, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

function FooterSkeleton() {
	return (
		<footer className="animate-pulse border-neutral-300 bg-neutral-50">
			<div className="mx-auto max-w-7xl px-4 lg:px-8">
				<div className="grid grid-cols-3 gap-8 py-16">
					{[1, 2, 3].map((i) => (
						<div key={i}>
							<div className="mb-4 h-4 w-1/2 rounded bg-neutral-200"></div>
							<div className="space-y-2">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="h-3 rounded bg-neutral-200"></div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</footer>
	);
}

export function getSaleorLanguage(locale: string): LanguageCodeEnum {
	switch (locale) {
		case "en":
			return LanguageCodeEnum.EnUs;
		case "ar":
			return LanguageCodeEnum.Ar;
		default:
			return LanguageCodeEnum.EnUs;
	}
}

async function getFooterData(channel: string, locale: string) {
	try {
		const saleorLanguage = getSaleorLanguage(locale);
		console.log("Locale:", locale, "→ Saleor language:", saleorLanguage);

		const [footerLinks, channels] = await Promise.all([
			executeGraphQL(MenuGetBySlugDocument, {
				variables: {
					slug: "footer",
					channel,
					language: saleorLanguage,
				},

				//revalidate: 60 * 60 * 24,
				revalidate: 1,
			}),

			process.env.SALEOR_APP_TOKEN
				? executeGraphQL(ChannelsListDocument, {
						withAuth: false,
						headers: {
							Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
						},
					})
				: Promise.resolve(null),
		]);

		return { footerLinks, channels };
	} catch (error) {
		console.error("Error fetching footer data:", error);
		return { footerLinks: null, channels: null };
	}
}

function getTranslatedText(original: any, translation: any, field: string = "name"): string {
	if (translation && translation[field]) {
		return translation[field];
	}

	return original?.[field] || original?.name || original?.title || "";
}

async function FooterContent({ channel, locale }: { channel: string; locale: string }) {
	const { footerLinks, channels } = await getFooterData(channel, locale);
	const currentYear = new Date().getFullYear();

	if (!footerLinks) {
		return (
			<footer className="border-neutral-300 bg-neutral-50">
				<div className="mx-auto max-w-7xl px-4 lg:px-8">
					<div className="py-16 text-center">
						<p className="text-neutral-500">loadingError</p>
					</div>
					<div className="flex flex-col justify-between border-t border-neutral-200 py-10 sm:flex-row">
						<p className="text-sm text-neutral-500">copyright, {currentYear}</p>
					</div>
				</div>
			</footer>
		);
	}

	return (
		<footer className="border-neutral-300 bg-neutral-50">
			<div className="mx-auto max-w-7xl px-4 lg:px-8">
				<div className="grid grid-cols-1 gap-8 py-16 md:grid-cols-3">
					{footerLinks.menu?.items?.map((item) => (
						<div key={item.id}>
							<h3 className="text-sm font-semibold text-neutral-900">
								{getTranslatedText(item, item.translation)}
							</h3>
							<ul className="mt-4 space-y-4 [&>li]:text-neutral-500">
								{item.children?.map(async (child) => {
									const childName = getTranslatedText(child, child.translation);
									//console.log("Child item:", child, "Resolved name:", childName);

									if (child.category) {
										const categoryName = getTranslatedText(child.category, child.category.translation);
										//console.log("Category item:", child.category, "Resolved name:", categoryName);

										return (
											<li key={child.id} className="text-sm">
												<LinkWithChannel href={`/categories/${child.category.slug}`}>
													{categoryName}
												</LinkWithChannel>
											</li>
										);
									}

									if (child.collection) {
										const collectionName = getTranslatedText(child.collection, child.collection.translation);
										//	console.log("Collection name:", collectionName);

										return (
											<li key={child.id} className="text-sm">
												<LinkWithChannel href={`/collections/${child.collection.slug}`}>
													{collectionName}
												</LinkWithChannel>
											</li>
										);
									}
									if (child.page) {
										const pageTitle = getTranslatedText(child.page, child.page.translation, "title");
										return (
											<li key={child.id} className="text-sm">
												<LinkWithChannel href={`/pages/${child.page.slug}`}>{pageTitle}</LinkWithChannel>
											</li>
										);
									}

									if (child.url) {
										return (
											<li key={child.id} className="text-sm">
												<LinkWithChannel href={child.url}>{childName}</LinkWithChannel>
											</li>
										);
									}

									return null;
								})}
							</ul>
						</div>
					))}
				</div>

				{channels?.channels && (
					<div className="mb-4 text-neutral-500">
						<label>
							<span className="text-sm">changeCurrency</span>
							<ChannelSelect channels={channels.channels} />
						</label>
					</div>
				)}

				<div className="flex flex-col justify-between border-t border-neutral-200 py-10 sm:flex-row">
					<p className="text-sm text-neutral-500">copyright, {currentYear}</p>
					<p className="flex gap-1 text-sm text-neutral-500">
						poweredBy
						<Link
							href={"https://github.com/ibrahimForIT"}
							target={"_blank"}
							className={"opacity-30 transition-opacity hover:opacity-70"}
						>
							<Image alt="Saleor github repository" height={20} width={20} src={"/github-mark.svg"} />
						</Link>
					</p>
				</div>
			</div>
		</footer>
	);
}

export function Footer({ channel, locale }: { channel: string; locale: string }) {
	return (
		<Suspense fallback={<FooterSkeleton />}>
			<FooterContent channel={channel} locale={locale} />
		</Suspense>
	);
}
