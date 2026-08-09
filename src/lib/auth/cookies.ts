import { type NextRequest, type NextResponse } from "next/server";

export const COOKIE_ACCESS_TOKEN = "saleor_token";
export const COOKIE_REFRESH_TOKEN = "saleor_refresh_token";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setAuthCookies(response: NextResponse, token: string, refreshToken: string): void {
	const base = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
		maxAge: COOKIE_MAX_AGE,
	};
	response.cookies.set(COOKIE_ACCESS_TOKEN, token, base);
	response.cookies.set(COOKIE_REFRESH_TOKEN, refreshToken, base);
}

export function clearAuthCookies(response: NextResponse): void {
	response.cookies.set(COOKIE_ACCESS_TOKEN, "", { maxAge: 0, path: "/" });
	response.cookies.set(COOKIE_REFRESH_TOKEN, "", { maxAge: 0, path: "/" });
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
	return request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | undefined {
	return request.cookies.get(COOKIE_REFRESH_TOKEN)?.value;
}
