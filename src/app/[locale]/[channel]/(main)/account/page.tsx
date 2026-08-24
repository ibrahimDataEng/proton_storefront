import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { CurrentUserOrderListDocument } from "@/gql/graphql";
import { Container } from "@/ui/components/Container";
import { AccountDashboard } from "@/ui/components/account/AccountDashboard";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

export default async function AccountPage(props: { params: Promise<{ locale: string; channel: string }> }) {
	const { locale, channel } = await props.params;
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

	if (!token) {
		redirect(`/${locale}/${channel}/login`);
	}

	let user;
	try {
		const data = await executeGraphQL(CurrentUserOrderListDocument, {
			cache: "no-cache",
			headers: { Authorization: `Bearer ${token}` },
		});
		user = data.me;
	} catch {
		redirect(`/${locale}/${channel}/login`);
	}

	if (!user) {
		redirect(`/${locale}/${channel}/login`);
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] py-10">
			<Container>
				<AccountDashboard user={user} locale={locale} />
			</Container>
		</main>
	);
}
