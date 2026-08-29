// components/Footer.tsx
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";

import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
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
							<div className="mb-4 h-4 w-1/2 rounded bg-content-footer/10"></div>
							<div className="space-y-2">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="h-3 rounded bg-content-footer/10"></div>
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

const columnTitleClass = "text-content-footer text-sm font-medium tracking-widest uppercase mb-4";
const linkClass = "text-content-footer/70 hover:text-content-footer text-sm py-1 transition-colors block";
const socialLinkClass =
	"flex items-center gap-2 text-content-footer/70 hover:text-content-footer text-sm py-1 transition-colors";

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
		? `جميع الحقوق محفوظة © ${currentYear} Tawasi Plus`
		: `© ${currentYear} Tawasi Plus. All rights reserved.`;

	const alternateLocale = locale === "ar" ? "en" : "ar";
	const alternateLocaleLabel = locale === "ar" ? "English" : "العربية";
	const alternateLocaleHref = `/${alternateLocale}/${channel}`;

	const legalLinks = [
		{ href: "/pages/privacy-policy", label: isAr ? "سياسة الخصوصية" : "Privacy Policy" },
		{ href: "/pages/terms", label: isAr ? "شروط الخدمة" : "Terms of Service" },
		{ href: "/pages/cookies", label: isAr ? "سياسة ملفات الارتباط" : "Cookie Policy" },
	];

	return (
		<footer className="bg-surface-footer py-16 text-content-footer md:py-20">
			<div className="mx-auto max-w-7xl px-4 lg:px-8">
				<div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
					{/* Column 1 — Brand */}
					<div>
						<div className="flex flex-wrap items-center gap-3">
							<Logo className="brightness-0 invert" />
							<span className="h-8 w-px bg-content-footer/15" aria-hidden="true" />
							{/* Secondary mark: parent company (Green Line Group), forced white to match the main logo */}
							<Image
								src="/greenline-mark.png"
								alt="Green Line Group"
								width={822}
								height={336}
								className="h-9 w-auto brightness-0 invert"
							/>
						</div>
						<p className="mb-6 mt-3 text-sm leading-relaxed text-content-footer/60">{description}</p>
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
								<a
									href="https://wa.me/971558711442"
									target="_blank"
									rel="noopener noreferrer"
									className={socialLinkClass}
								>
									{/* WhatsApp SVG — matches CheckoutWhatsApp.tsx's icon (lucide-react has no WhatsApp glyph) */}
									<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
									</svg>
									<span>WhatsApp</span>
								</a>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-16 border-t border-content-footer/10 pt-6">
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
							className="text-sm text-neutral-500 transition-colors hover:text-content-footer"
						>
							{alternateLocaleLabel}
						</Link>
						<span className="mx-1 text-content-footer/20" aria-hidden="true">
							·
						</span>
						<ThemeToggle variant="inverse" />
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
