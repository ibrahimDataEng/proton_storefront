import { notFound } from "next/navigation";
import { type Metadata } from "next";
import edjsHTML from "editorjs-html";
import xss from "xss";
import { LanguageCodeEnum, PageGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

const parser = edjsHTML();

export function getLanguage(locale: string): LanguageCodeEnum {
	switch (locale) {
		case "en":
			return LanguageCodeEnum.EnUs;
		case "ar":
			return LanguageCodeEnum.Ar;
		default:
			return LanguageCodeEnum.EnUs;
	}
}

export const generateMetadata = async (props: {
	params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> => {
	const params = await props.params;
	const language = getLanguage(params.locale);

	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: { slug: params.slug, language: language },
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
	const language = getLanguage(params.locale);
	console.log(params.locale);

	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: { slug: params.slug, language: language },
		revalidate: 1,
	});

	if (!page) notFound();

	const localizedPage = params.locale === "ar" && page.translation ? page.translation : page;
	const title = localizedPage?.title || "Page";
	const contentJson = localizedPage?.content ? JSON.parse(localizedPage.content) : null;

	//console.log("Page content:", title, localizedPage?.content);

	const contentHtml = contentJson ? parser.parse(contentJson) : null;

	return (
		<div className="mx-auto max-w-7xl p-8 pb-16">
			<h1 className="text-3xl font-semibold">{title}</h1>
			{contentHtml && (
				<div className="prose">
					{contentHtml.map((html, index) => (
						<div key={index} dangerouslySetInnerHTML={{ __html: xss(html) }} />
					))}
				</div>
			)}
		</div>
	);
}
