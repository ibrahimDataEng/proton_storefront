"use client";

import { useEffect, useState } from "react";

export const LanguageSwitcher = () => {
	const [language, setLanguage] = useState("en");

	useEffect(() => {
		const storedLang = localStorage.getItem("storeLang");
		if (storedLang) setLanguage(storedLang);
	}, []);

	const toggleLanguage = () => {
		const newLang = language === "en" ? "ar" : "en";
		setLanguage(newLang);
		localStorage.setItem("storeLang", newLang);
		// Add your i18n logic here if needed
	};

	const langLabel = language === "en" ? "العربية" : "English";

	return (
		<button
			className="px-2 py-1 rounded border text-xs"
			onClick={toggleLanguage}
			aria-label="Switch language"
		>
			{langLabel}
		</button>
	);
}