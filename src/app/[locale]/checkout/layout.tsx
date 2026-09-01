import { type ReactNode } from "react";
import { AuthProvider } from "@/ui/components/AuthProvider";

export const metadata = {
	title: "Tawasi Plus",
	description:
		"Tawasi Plus Store is a leading online retailer offering a wide range of products like nuts, dried fruits, coffee, spices and more at competitive prices. Shop with confidence and enjoy fast shipping and excellent customer service.",
};

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<main>
			<AuthProvider>{props.children}</AuthProvider>
		</main>
	);
}
