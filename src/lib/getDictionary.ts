import "server-only";
import en from "../../locales/en.json";
import ar from "../../locales/ar.json";

const dictionaries: Record<string, any> = {
	en,
	ar,
};

export const getDictionary = async (locale: string) => {
	return dictionaries[locale] ?? dictionaries["en"];
};
