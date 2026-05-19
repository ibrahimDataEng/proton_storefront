// components/Footer.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Instagram, Twitter, Linkedin } from "lucide-react";

import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { Logo } from "./Logo";
import { ChannelsListDocument, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";

function FooterSkeleton() {
	return (
		<footer className="animate-pulse bg-surface-footer">
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
	return original?.[field] || original?.name || original?.title || "";
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
		? `حقوق الطبع والنشر © لعام ${currentYear} محفوظة لشركة Green Line Group`
		: `© ${currentYear} Green Line Group. All rights reserved.`;

	const alternateLocale = locale === "ar" ? "en" : "ar";
	const alternateLocaleLabel = locale === "ar" ? "English" : "العربية";
	const alternateLocaleHref = `/${alternateLocale}/${channel}`;

	const legalLinks = [
		{ href: "/pages/privacy-policy", label: isAr ? "سياسة الخصوصية" : "Privacy Policy" },
		{ href: "/pages/terms", label: isAr ? "شروط الخدمة" : "Terms of Service" },
		{ href: "/pages/cookies", label: isAr ? "سياسة ملفات الارتباط" : "Cookie Policy" },
		{ href: "/pages/contact", label: isAr ? "اتصل بنا" : "Contact Us" },
	];

	return (
		<footer className="bg-surface-footer py-16 text-content-inverse md:py-20">
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
				<div className="mt-16 border-t border-content-inverse/10 pt-6">
					{/* Language switcher */}
					<div className="mb-5 flex items-center justify-center gap-2">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={1.8}
							className="text-neutral-500"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="2" y1="12" x2="22" y2="12" />
							<path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
						</svg>
						<Link
							href={alternateLocaleHref}
							className="text-sm text-neutral-500 transition-colors hover:text-content-inverse"
						>
							{alternateLocaleLabel}
						</Link>
					</div>

					{/* Payment icons */}
					<div className="mb-4 flex flex-wrap items-center justify-center gap-2">
						{/* VISA */}
						<div className="flex h-6 items-center justify-center rounded border border-white/20 bg-white/10 px-2.5 text-[11px] font-bold tracking-wider text-white">
							VISA
						</div>
						{/* Mastercard */}
						<div className="flex h-6 items-center justify-center rounded border border-white/20 bg-white/10 px-2">
							<svg width="30" height="18" viewBox="0 0 38 24" aria-label="Mastercard" role="img">
								<circle cx="14" cy="12" r="9" fill="#EB001B" opacity="0.9" />
								<circle cx="24" cy="12" r="9" fill="#F79E1B" opacity="0.9" />
								<path d="M19 5.5a9 9 0 010 13A9 9 0 0119 5.5z" fill="#FF5F00" opacity="0.9" />
							</svg>
						</div>
						{/* Cash */}
						<div className="flex h-6 items-center justify-center rounded border border-white/20 bg-white/10 px-2.5 text-[10px] text-white/80">
							{isAr ? "💵 كاش" : "💵 Cash"}
						</div>
					</div>

					{/* Legal links */}
					<div className="mb-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-neutral-500">
						<LinkWithChannel href="/pages/terms" className="transition-colors hover:text-neutral-300">
							{isAr ? "شروط الاستخدام" : "Terms of Use"}
						</LinkWithChannel>
						<span className="text-neutral-700">·</span>
						<LinkWithChannel
							href="/pages/privacy-policy"
							className="transition-colors hover:text-neutral-300"
						>
							{isAr ? "إشعار الخصوصية" : "Privacy Notice"}
						</LinkWithChannel>
					</div>

					{/* Copyright */}
					<p className="text-center text-[11px] text-neutral-600">{copyright}</p>
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
