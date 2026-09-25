import { NextResponse, type NextRequest } from "next/server";
import { type AuthErrorCode } from "@/lib/auth/errorCodes";
import { authErrorResponse } from "@/lib/auth/errorResponse";
import { setAuthCookies } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const TOKEN_CREATE = `
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      csrfToken
      user { id email firstName lastName }
      errors { field message code }
    }
  }
`;

const ERROR_MAP: Record<string, AuthErrorCode> = {
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	ACCOUNT_NOT_CONFIRMED: "ACCOUNT_NOT_CONFIRMED",
	INACTIVE: "INACTIVE",
	LOGIN_ATTEMPT_DELAYED: "LOGIN_ATTEMPT_DELAYED",
};

export async function POST(request: NextRequest) {
	const { email, password } = (await request.json()) as { email: string; password: string };

	if (!email || !password) {
		return authErrorResponse("EMAIL_PASSWORD_REQUIRED", 400);
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: TOKEN_CREATE, variables: { email, password } }),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			tokenCreate?: {
				token?: string;
				refreshToken?: string;
				user?: { id: string; email: string; firstName: string; lastName: string };
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.tokenCreate;
	if (!result) {
		return authErrorResponse("unknown", 500);
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return authErrorResponse(ERROR_MAP[code] ?? "unknown", 401);
	}

	if (!result.token || !result.refreshToken || !result.user) {
		return authErrorResponse("unknown", 500);
	}

	const response = NextResponse.json({ user: result.user });
	setAuthCookies(response, result.token, result.refreshToken);
	return response;
}
