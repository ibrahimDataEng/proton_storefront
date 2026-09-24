import { NextResponse, type NextRequest } from "next/server";
import { type AuthErrorCode } from "@/lib/auth/errorCodes";
import { authErrorResponse } from "@/lib/auth/errorResponse";
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

// Saleor AccountErrorCode → our code. Field-aware: accountRegister reuses the
// generic INVALID/REQUIRED codes for several fields, and only the email/password
// ones are something the customer can act on. Anything else maps to "unknown" —
// raw Saleor codes are never passed through (they have no message to render).
const PASSWORD_ERROR_MAP: Record<string, AuthErrorCode> = {
	PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
	PASSWORD_TOO_SIMILAR: "PASSWORD_TOO_SIMILAR",
	PASSWORD_TOO_COMMON: "PASSWORD_TOO_COMMON",
	PASSWORD_ENTIRELY_NUMERIC: "PASSWORD_ENTIRELY_NUMERIC",
};

function mapRegisterError(code: string, field: string | null): AuthErrorCode {
	if (field === "email") {
		if (code === "UNIQUE") return "UNIQUE";
		if (code === "INVALID") return "INVALID";
		if (code === "REQUIRED") return "EMAIL_PASSWORD_REQUIRED";
	}
	if (field === "password") {
		if (code === "REQUIRED") return "EMAIL_PASSWORD_REQUIRED";
		if (PASSWORD_ERROR_MAP[code]) return PASSWORD_ERROR_MAP[code];
	}
	return "unknown";
}

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
		return authErrorResponse("EMAIL_PASSWORD_REQUIRED", 400);
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
		return authErrorResponse("unknown", 500);
	}

	if (result.errors.length > 0) {
		const { code, field, message } = result.errors[0];
		const mapped = mapRegisterError(code, field);
		if (mapped === "unknown") {
			// Unmapped upstream error (e.g. a redirectUrl rejected by ALLOWED_CLIENT_HOSTS,
			// an inactive channel) — never shown to the customer, so keep it in the logs.
			console.error(`[register] unmapped accountRegister error: ${code} on ${field ?? "-"}: ${message}`);
		}
		return authErrorResponse(mapped, 400);
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
