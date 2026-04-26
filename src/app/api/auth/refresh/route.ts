import { NextResponse, type NextRequest } from "next/server";
import { getRefreshTokenFromRequest, COOKIE_ACCESS_TOKEN } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const TOKEN_REFRESH = `
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors { field message code }
    }
  }
`;

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
	const refreshToken = getRefreshTokenFromRequest(request);

	if (!refreshToken) {
		return NextResponse.json({ error: "NO_REFRESH_TOKEN" }, { status: 401 });
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: TOKEN_REFRESH, variables: { refreshToken } }),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			tokenRefresh?: {
				token?: string;
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.tokenRefresh;
	if (!result || result.errors.length > 0 || !result.token) {
		return NextResponse.json({ error: "REFRESH_FAILED" }, { status: 401 });
	}

	const response = NextResponse.json({ ok: true });
	response.cookies.set(COOKIE_ACCESS_TOKEN, result.token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: COOKIE_MAX_AGE,
	});
	return response;
}
