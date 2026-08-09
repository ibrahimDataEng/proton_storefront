import { NextResponse, type NextRequest } from "next/server";
import { setAuthCookies } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const ACCOUNT_REGISTER = `
  mutation AccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
      user { id email }
      requiresConfirmation
      errors { field message code }
    }
  }
`;

const TOKEN_CREATE = `
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      user { id email firstName lastName }
      errors { field message code }
    }
  }
`;

type RegisterInput = {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	channel?: string;
	redirectUrl?: string;
};

export async function POST(request: NextRequest) {
	const body = (await request.json()) as RegisterInput;
	const { email, password } = body;

	if (!email || !password) {
		return NextResponse.json({ error: "EMAIL_PASSWORD_REQUIRED" }, { status: 400 });
	}

	const input: RegisterInput = { email, password };
	if (body.firstName) input.firstName = body.firstName;
	if (body.lastName) input.lastName = body.lastName;
	if (body.channel) input.channel = body.channel;
	if (body.redirectUrl) input.redirectUrl = body.redirectUrl;

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: ACCOUNT_REGISTER, variables: { input } }),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			accountRegister?: {
				user?: { id: string; email: string } | null;
				requiresConfirmation?: boolean;
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.accountRegister;
	if (!result) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return NextResponse.json({ error: code ?? "unknown" }, { status: 400 });
	}

	const requiresConfirmation = result.requiresConfirmation ?? false;

	if (requiresConfirmation) {
		return NextResponse.json({ requiresConfirmation: true });
	}

	// Auto-login: call tokenCreate with the same credentials
	const loginRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: TOKEN_CREATE, variables: { email, password } }),
		cache: "no-store",
	});

	const loginJson = (await loginRes.json()) as {
		data?: {
			tokenCreate?: {
				token?: string;
				refreshToken?: string;
				user?: { id: string; email: string; firstName: string; lastName: string };
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const loginResult = loginJson.data?.tokenCreate;
	if (!loginResult || loginResult.errors.length > 0 || !loginResult.token || !loginResult.user) {
		// Registration succeeded but auto-login failed — still return success
		return NextResponse.json({ requiresConfirmation: false });
	}

	const response = NextResponse.json({
		requiresConfirmation: false,
		user: loginResult.user,
	});
	setAuthCookies(response, loginResult.token, loginResult.refreshToken ?? "");
	return response;
}
