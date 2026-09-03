import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getTokenFromRequest, getRefreshTokenFromRequest, COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";
import { isTokenExpiringSoon } from "@/lib/auth/jwt";

const intlMiddleware = createMiddleware(routing);

// @saleor/auth-sdk's SaleorAuthClient.fetchWithAuth reads a plain
// (non-httpOnly) cookie literally named "token" via document.cookie on its
// first call, adopts it as the checkout sub-app's access token, then
// deletes it — see node_modules/@saleor/auth-sdk SaleorAuthClient source.
// This is the SDK's own one-shot bridge; the name is not ours to choose.
const CHECKOUT_BRIDGE_COOKIE = "token";

// The checkout sub-app lives at src/app/[locale]/checkout/ — outside
// [channel] — so its path is always "/checkout" once the locale prefix is
// stripped.
function isCheckoutPath(pathname: string): boolean {
	for (const locale of routing.locales) {
		if (pathname === `/${locale}/checkout`) return true;
	}
	return pathname === "/checkout";
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
	// Run next-intl middleware first to get locale routing / redirects
	const intlResponse = intlMiddleware(request);

	// Only attempt refresh on non-API, non-static paths with a refresh token
	const { pathname } = request.nextUrl;
	const isStaticOrApi =
		pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.includes(".");

	const response = intlResponse ?? NextResponse.next();

	if (!isStaticOrApi) {
		const accessToken = getTokenFromRequest(request);
		const refreshToken = getRefreshTokenFromRequest(request);
		let effectiveAccessToken = accessToken;

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
						response.cookies.set(COOKIE_ACCESS_TOKEN, newToken, {
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 60 * 60 * 24 * 30,
						});
						effectiveAccessToken = newToken;
					}
				}
			} catch {
				// Refresh failed — let the request through; client will handle auth state
			}
		}

		// Bridge the logged-in session into the checkout sub-app's isolated
		// @saleor/auth-sdk client (see CLAUDE.md "Checkout Customer
		// Recognition" for the full diagnostic). Scoped to /checkout only,
		// and only when a valid session exists — guests and every other
		// route are completely unaffected. Short maxAge minimizes how long a
		// JS-readable token cookie exists; the SDK also deletes it itself on
		// first read.
		if (effectiveAccessToken && isCheckoutPath(pathname)) {
			response.cookies.set(CHECKOUT_BRIDGE_COOKIE, effectiveAccessToken, {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60,
			});
		}
	}

	return response;
}

export const config = {
	// Exclude paths with file extensions — next-intl would otherwise 307-redirect /logo.png to /<locale>/logo.png
	matcher: ["/((?!api|_next/static|_next/image|_next/|favicon.ico|.*\\..*).*)"],
};
