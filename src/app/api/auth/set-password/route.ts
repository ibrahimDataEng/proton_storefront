import { NextResponse, type NextRequest } from "next/server";
import { type AuthErrorCode } from "@/lib/auth/errorCodes";
import { authErrorResponse } from "@/lib/auth/errorResponse";
import { setAuthCookies } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const SET_PASSWORD = `
  mutation SetPassword($email: String!, $token: String!, $password: String!) {
    setPassword(email: $email, token: $token, password: $password) {
      token
      refreshToken
      user { id email firstName lastName }
      errors { field message code }
    }
  }
`;

const ERROR_MAP: Record<string, AuthErrorCode> = {
	TOKEN_INVALID: "TOKEN_INVALID",
	INVALID: "TOKEN_INVALID",
	INVALID_PASSWORD: "INVALID_PASSWORD",
	PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
	PASSWORD_TOO_SIMILAR: "PASSWORD_TOO_SIMILAR",
	PASSWORD_TOO_COMMON: "PASSWORD_TOO_COMMON",
	PASSWORD_ENTIRELY_NUMERIC: "PASSWORD_ENTIRELY_NUMERIC",
};

export async function POST(request: NextRequest) {
	const { email, token, password } = (await request.json()) as {
		email: string;
		token: string;
		password: string;
	};

	if (!email || !token || !password) {
		return authErrorResponse("MISSING_FIELDS", 400);
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: SET_PASSWORD, variables: { email, token, password } }),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			setPassword?: {
				token?: string;
				refreshToken?: string;
				user?: { id: string; email: string; firstName: string; lastName: string };
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.setPassword;
	if (!result) {
		return authErrorResponse("unknown", 500);
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return authErrorResponse(ERROR_MAP[code] ?? "unknown", 400);
	}

	if (!result.token || !result.refreshToken || !result.user) {
		return authErrorResponse("unknown", 500);
	}

	const response = NextResponse.json({ user: result.user });
	setAuthCookies(response, result.token, result.refreshToken);
	return response;
}
