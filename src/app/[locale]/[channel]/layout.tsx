import { type ReactNode } from "react";
import { cookies } from "next/headers";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";
import { AuthProvider } from "@/ui/context/AuthContext";
import { AuthModal } from "@/ui/components/auth/AuthModal";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { type AuthUser } from "@/lib/auth/types";

export const generateStaticParams = async () => {
	if (process.env.SALEOR_APP_TOKEN) {
		const channels = await executeGraphQL(ChannelsListDocument, {
			withAuth: false,
			headers: {
				Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
			},
		});
		return (
			channels.channels
				?.filter((channel) => channel.isActive)
				.map((channel) => ({ channel: channel.slug })) ?? []
		);
	} else {
		return [{ channel: "default-channel" }];
	}
};

function getInitialUser(token: string | undefined): AuthUser | null {
	if (!token) return null;
	try {
		const payload = decodeJwtPayload(token);
		// Saleor JWT payload carries email; id and name need a separate fetch for full data.
		// We seed a minimal user so the header renders "logged in" immediately without a flash.
		return {
			id: (payload["user_id"] as string | undefined) ?? "",
			email: payload.email ?? "",
			firstName: (payload["first_name"] as string | undefined) ?? "",
			lastName: (payload["last_name"] as string | undefined) ?? "",
		};
	} catch {
		return null;
	}
}

export default async function ChannelLayout({ children }: { children: ReactNode }) {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
	const initialUser = getInitialUser(token);

	return (
		<AuthProvider initialUser={initialUser}>
			{children}
			<AuthModal />
		</AuthProvider>
	);
}
