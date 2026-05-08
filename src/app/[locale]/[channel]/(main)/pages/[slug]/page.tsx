import { notFound } from "next/navigation";
import { type Metadata } from "next";
import edjsHTML from "editorjs-html";
import xss from "xss";
import { getTranslations } from "next-intl/server";
import { PageGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getSaleorLanguage } from "@/lib/saleor-language";
import { Container } from "@/ui/components/Container";
import { ContactPageClient } from "@/ui/components/contact/ContactPageClient";
import { WholesalePageClient } from "@/ui/components/wholesale/WholesalePageClient";

const parser = edjsHTML();

export const generateMetadata = async (props: {
	params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> => {
	const params = await props.params;

	if (params.slug === "contact-us") {
		const t = await getTranslations({ locale: params.locale, namespace: "contact" });
		return {
			title: `${t("title")} · Green Line Group`,
			description: t("subtitle"),
		};
	}

	if (params.slug === "wholesale") {
		const t = await getTranslations({ locale: params.locale, namespace: "wholesale" });
		return {
			title: `${t("hero.headline")} · Green Line Group`,
			description: t("hero.subtitle"),
		};
	}

	const language = getSaleorLanguage(params.locale);

	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: { slug: params.slug, language },
		revalidate: 1,
	});

	if (!page) {
		return { title: "Page · Saleor Storefront example", description: "" };
	}

	const localizedPage = params.locale === "ar" && page.translation ? page.translation : page;

	return {
		title: `${localizedPage?.seoTitle || localizedPage?.title || "Page"} · Saleor Storefront example`,
		description: localizedPage?.seoDescription || localizedPage?.title,
	};
};

export default async function Page(props: { params: Promise<{ slug: string; locale: string }> }) {
	const params = await props.params;

	if (params.slug === "contact-us") {
		return <ContactPageClient />;
	}

	if (params.slug === "wholesale") {
		return <WholesalePageClient />;
	}

	const language = getSaleorLanguage(params.locale);

	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: { slug: params.slug, language },
		revalidate: 1,
	});

	if (!page) notFound();

	const localizedPage = params.locale === "ar" && page.translation ? page.translation : page;
	const title = localizedPage?.title || "Page";
	const contentJson = localizedPage?.content ? JSON.parse(localizedPage.content) : null;
	const contentHtml = contentJson ? parser.parse(contentJson) : null;

	return (
		<Container className="pb-16 pt-8">
			<h1 className="text-3xl font-semibold text-content-primary">{title}</h1>
			{contentHtml && (
				<div className="prose mt-6 max-w-none prose-headings:text-content-primary prose-p:text-content-secondary prose-a:text-brand-primary prose-strong:text-content-primary">
					{contentHtml.map((html, index) => (
						<div key={index} dangerouslySetInnerHTML={{ __html: xss(html) }} />
					))}
				</div>
			)}
		</Container>
	);
}
