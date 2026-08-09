import { NextResponse, type NextRequest } from "next/server";
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

const ERROR_MAP: Record<string, string> = {
	INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
	ACCOUNT_NOT_CONFIRMED: "ACCOUNT_NOT_CONFIRMED",
	INACTIVE: "INACTIVE",
};

export async function POST(request: NextRequest) {
	const { email, password } = (await request.json()) as { email: string; password: string };

	if (!email || !password) {
		return NextResponse.json({ error: "EMAIL_PASSWORD_REQUIRED" }, { status: 400 });
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
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return NextResponse.json({ error: ERROR_MAP[code] ?? "unknown" }, { status: 401 });
	}

	if (!result.token || !result.refreshToken || !result.user) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	const response = NextResponse.json({ user: result.user });
	setAuthCookies(response, result.token, result.refreshToken);
	return response;
}
