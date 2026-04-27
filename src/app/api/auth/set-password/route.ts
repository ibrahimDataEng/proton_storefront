import { NextResponse, type NextRequest } from "next/server";
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

const ERROR_MAP: Record<string, string> = {
	TOKEN_INVALID: "TOKEN_INVALID",
	INVALID: "TOKEN_INVALID",
	INVALID_PASSWORD: "INVALID_PASSWORD",
	PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
	PASSWORD_TOO_SIMILAR: "PASSWORD_TOO_SIMILAR",
};

export async function POST(request: NextRequest) {
	const { email, token, password } = (await request.json()) as {
		email: string;
		token: string;
		password: string;
	};

	if (!email || !token || !password) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
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
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return NextResponse.json({ error: ERROR_MAP[code] ?? "unknown" }, { status: 400 });
	}

	if (!result.token || !result.refreshToken || !result.user) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	const response = NextResponse.json({ user: result.user });
	setAuthCookies(response, result.token, result.refreshToken);
	return response;
}
