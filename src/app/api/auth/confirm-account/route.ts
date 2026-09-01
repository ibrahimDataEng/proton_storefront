import { NextResponse, type NextRequest } from "next/server";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const CONFIRM_ACCOUNT = `
  mutation ConfirmAccount($email: String!, $token: String!) {
    confirmAccount(email: $email, token: $token) {
      user { id email }
      errors { field message code }
    }
  }
`;

const ERROR_MAP: Record<string, string> = {
	INVALID: "TOKEN_INVALID",
	NOT_FOUND: "TOKEN_INVALID",
};

export async function POST(request: NextRequest) {
	const { email, token } = (await request.json()) as {
		email: string;
		token: string;
	};

	if (!email || !token) {
		return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: CONFIRM_ACCOUNT, variables: { email, token } }),
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
		const code = result.errors[0].code;
		return NextResponse.json({ error: ERROR_MAP[code] ?? "unknown" }, { status: 400 });
	}

	if (!result.user) {
		return NextResponse.json({ error: "unknown" }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
