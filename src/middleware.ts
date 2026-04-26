import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getTokenFromRequest, getRefreshTokenFromRequest, COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { isTokenExpiringSoon } from "@/lib/auth/jwt";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest): Promise<NextResponse> {
	// Run next-intl middleware first to get locale routing / redirects
	const intlResponse = intlMiddleware(request);

	// Only attempt refresh on non-API, non-static paths with a refresh token
	const { pathname } = request.nextUrl;
	const isStaticOrApi =
		pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.includes(".");

	if (!isStaticOrApi) {
		const accessToken = getTokenFromRequest(request);
		const refreshToken = getRefreshTokenFromRequest(request);

		if (refreshToken && (!accessToken || isTokenExpiringSoon(accessToken))) {
			try {
				const refreshUrl = new URL("/api/auth/refresh", request.url);
				const refreshRes = await fetch(refreshUrl, {
					method: "POST",
					headers: {
						// Forward refresh token cookie to the route handler
						cookie: request.headers.get("cookie") ?? "",
					},
				});

				if (refreshRes.ok) {
					// Parse new token from set-cookie header (plain Response, not NextResponse)
					const setCookie = refreshRes.headers.get("set-cookie") ?? "";
					const match = setCookie.match(new RegExp(`${COOKIE_ACCESS_TOKEN}=([^;]+)`));
					const newToken = match?.[1];
					if (newToken) {
						const response = intlResponse ?? NextResponse.next();
						response.cookies.set(COOKIE_ACCESS_TOKEN, newToken, {
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 60 * 60 * 24 * 30,
						});
						return response;
					}
				}
			} catch {
				// Refresh failed — let the request through; client will handle auth state
			}
		}
	}

	return intlResponse ?? NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
