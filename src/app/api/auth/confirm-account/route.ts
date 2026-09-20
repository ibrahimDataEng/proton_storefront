import { NextResponse, type NextRequest } from "next/server";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const CONFIRM_ACCOUNT = `
  mutation ConfirmAccount($email: String!, $token: String!, $password: String!) {
    confirmAccount(email: $email, token: $token, password: $password) {
      user { id email }
      errors { field message code }
    }
  }
`;

const ERROR_MAP: Record<string, string> = {
	NOT_FOUND: "TOKEN_INVALID",
	INVALID_PASSWORD: "INVALID_PASSWORD",
	PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
	PASSWORD_TOO_SIMILAR: "PASSWORD_TOO_SIMILAR",
};

// Saleor's confirmAccount resolver returns the identical code: "INVALID" for both
// an invalid/expired token and (under accountConfirmMergeMode: REQUIRE_PASSWORD) a
// wrong password — the only way to tell them apart is which field the error is on.
function mapConfirmAccountError(code: string, field: string | null): string {
	if (code === "INVALID") {
		return field === "password" ? "INVALID_PASSWORD" : "TOKEN_INVALID";
	}
	return ERROR_MAP[code] ?? "unknown";
}

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
		body: JSON.stringify({ query: CONFIRM_ACCOUNT, variables: { email, token, password } }),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			confirmAccount?: {
				user?: { id: string; email: string } | null;
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.confirmAccount;
	if (!result) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	if (result.errors.length > 0) {
		const { code, field } = result.errors[0];
		return NextResponse.json({ error: mapConfirmAccountError(code, field) }, { status: 400 });
	}

	if (!result.user) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
