import { type ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";
import { AuthProvider } from "@/ui/context/AuthContext";
import { AuthModal } from "@/ui/components/auth/AuthModal";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { type AuthUser } from "@/lib/auth/types";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

// Raw fetch on purpose, not executeGraphQL + a generated Document: this check
// must work without a src/graphql/ source file or a codegen run. Query.channel(slug)
// has no permission requirement in the Saleor schema (unlike Query.channels, which is
// AUTHENTICATED_APP/AUTHENTICATED_STAFF_USER-only and needs SALEOR_APP_TOKEN — see
// generateStaticParams below), so this works in every environment.
const CHANNEL_BY_SLUG_QUERY = `
	query ChannelBySlug($slug: String!) {
		channel(slug: $slug) {
			id
		}
	}
`;

async function channelExists(slug: string): Promise<boolean> {
	try {
		const res = await fetch(SALEOR_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: CHANNEL_BY_SLUG_QUERY, variables: { slug } }),
			next: { revalidate: 3600 },
		});
		// Fail open on a transport error — a Saleor blip shouldn't 404 every visitor.
		if (!res.ok) return true;
		const json = (await res.json()) as { data?: { channel?: { id: string } | null } };
		return Boolean(json.data?.channel);
	} catch {
		return true;
	}
}

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

export default async function ChannelLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await params;
	if (!(await channelExists(channel))) {
		notFound();
	}

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
