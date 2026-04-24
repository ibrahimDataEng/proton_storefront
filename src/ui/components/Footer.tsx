// components/Footer.tsx
import { Suspense } from "react";
import { Instagram, Twitter, Linkedin } from "lucide-react";

import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { Logo } from "./Logo";
import { ChannelsListDocument, LanguageCodeEnum, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

function FooterSkeleton() {
	return (
		<footer className="animate-pulse bg-brand-primary">
			<div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
				<div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					{[1, 2, 3, 4].map((i) => (
						<div key={i}>
							<div className="mb-4 h-4 w-1/2 rounded bg-content-inverse/10"></div>
							<div className="space-y-2">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="h-3 rounded bg-content-inverse/10"></div>
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

		const [footerLinks, channels] = await Promise.all([
			executeGraphQL(MenuGetBySlugDocument, {
				variables: {
					slug: "footer",
					channel,
					language: saleorLanguage,
				},
				revalidate: 60,
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

type Translatable =
	| {
			name?: string | null;
			title?: string | null;
	  }
	| null
	| undefined;

function getTranslatedText(
	original: Translatable,
	translation: Translatable,
	field: "name" | "title" = "name",
): string {
	if (translation && translation[field]) {
		return translation[field] as string;
	}
	return (original?.[field] || original?.name || original?.title || "");
}

const columnTitleClass = "text-content-inverse text-sm font-medium tracking-widest uppercase mb-4";
const linkClass = "text-content-inverse/70 hover:text-content-inverse text-sm py-1 transition-colors block";
const socialLinkClass =
	"flex items-center gap-2 text-content-inverse/70 hover:text-content-inverse text-sm py-1 transition-colors";

async function FooterContent({ channel, locale }: { channel: string; locale: string }) {
	const { footerLinks, channels } = await getFooterData(channel, locale);
	const currentYear = new Date().getFullYear();
	const isAr = locale === "ar";

	const description = isAr
		? "مجموعات مختارة بعناية لذوق رفيع."
		: "Curated collections for the discerning eye.";
	const exploreTitle = isAr ? "استكشف" : "Explore";
	const legalTitle = isAr ? "قانوني" : "Legal";
	const followTitle = isAr ? "تابعنا" : "Follow Us";
	const copyright = isAr
		? `© ${currentYear} متجرك. جميع الحقوق محفوظة.`
		: `© ${currentYear} Your Store. All rights reserved.`;

	const legalLinks = [
		{ href: "/pages/privacy-policy", label: isAr ? "سياسة الخصوصية" : "Privacy Policy" },
		{ href: "/pages/terms", label: isAr ? "شروط الخدمة" : "Terms of Service" },
		{ href: "/pages/cookies", label: isAr ? "سياسة ملفات الارتباط" : "Cookie Policy" },
		{ href: "/pages/contact", label: isAr ? "اتصل بنا" : "Contact Us" },
	];

	return (
		<footer className="bg-brand-primary py-16 text-content-inverse md:py-20">
			<div className="mx-auto max-w-7xl px-4 lg:px-8">
				<div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					{/* Column 1 — Brand */}
					<div>
						<Logo className="brightness-0 invert" />
						<p className="mb-6 mt-3 text-sm leading-relaxed text-content-inverse/60">{description}</p>
						{channels?.channels && <ChannelSelect channels={channels.channels} />}
					</div>

					{/* Column 2 — Explore (CMS menu) */}
					<div>
						<h3 className={columnTitleClass}>{exploreTitle}</h3>
						<ul>
							{footerLinks?.menu?.items?.flatMap((item) =>
								(item.children ?? []).map((child) => {
									const childName = getTranslatedText(child, child.translation);

									if (child.category) {
										const categoryName = getTranslatedText(child.category, child.category.translation);
										return (
											<li key={child.id}>
												<LinkWithChannel href={`/categories/${child.category.slug}`} className={linkClass}>
													{categoryName}
												</LinkWithChannel>
											</li>
										);
									}
									if (child.collection) {
										const collectionName = getTranslatedText(child.collection, child.collection.translation);
										return (
											<li key={child.id}>
												<LinkWithChannel href={`/collections/${child.collection.slug}`} className={linkClass}>
													{collectionName}
												</LinkWithChannel>
											</li>
										);
									}
									if (child.page) {
										const pageTitle = getTranslatedText(child.page, child.page.translation, "title");
										return (
											<li key={child.id}>
												<LinkWithChannel href={`/pages/${child.page.slug}`} className={linkClass}>
													{pageTitle}
												</LinkWithChannel>
											</li>
										);
									}
									if (child.url) {
										return (
											<li key={child.id}>
												<LinkWithChannel href={child.url} className={linkClass}>
													{childName}
												</LinkWithChannel>
											</li>
										);
									}
									return null;
								}),
							)}
						</ul>
					</div>

					{/* Column 3 — Legal */}
					<div>
						<h3 className={columnTitleClass}>{legalTitle}</h3>
						<ul>
							{legalLinks.map((link) => (
								<li key={link.href}>
									<LinkWithChannel href={link.href} className={linkClass}>
										{link.label}
									</LinkWithChannel>
								</li>
							))}
						</ul>
					</div>

					{/* Column 4 — Social */}
					<div>
						<h3 className={columnTitleClass}>{followTitle}</h3>
						<ul>
							<li>
								<a
									href="https://instagram.com"
									target="_blank"
									rel="noopener noreferrer"
									className={socialLinkClass}
								>
									<Instagram size={16} strokeWidth={1.5} />
									<span>Instagram</span>
								</a>
							</li>
							<li>
								<a href="https://x.com" target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
									<Twitter size={16} strokeWidth={1.5} />
									<span>X</span>
								</a>
							</li>
							<li>
								<a
									href="https://linkedin.com"
									target="_blank"
									rel="noopener noreferrer"
									className={socialLinkClass}
								>
									<Linkedin size={16} strokeWidth={1.5} />
									<span>LinkedIn</span>
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-content-inverse/10 pt-6 md:flex-row">
					<p className="text-xs text-content-inverse/50">{copyright}</p>
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
