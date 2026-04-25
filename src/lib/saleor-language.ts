import { LanguageCodeEnum } from "@/gql/graphql";

export function getSaleorLanguage(locale: string): LanguageCodeEnum {
	return locale === "ar" ? LanguageCodeEnum.Ar : LanguageCodeEnum.EnUs;
}
