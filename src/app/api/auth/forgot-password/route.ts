import { NextResponse, type NextRequest } from "next/server";
import { authErrorResponse } from "@/lib/auth/errorResponse";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const REQUEST_PASSWORD_RESET = `
  mutation RequestPasswordReset($email: String!, $redirectUrl: String!, $channel: String!) {
    requestPasswordReset(email: $email, redirectUrl: $redirectUrl, channel: $channel) {
      errors { field message code }
    }
  }
`;

export async function POST(request: NextRequest) {
	const { email, redirectUrl, channel } = (await request.json()) as {
		email: string;
		redirectUrl: string;
		channel: string;
	};

	if (!email || !redirectUrl || !channel) {
		return authErrorResponse("MISSING_FIELDS", 400);
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: REQUEST_PASSWORD_RESET,
			variables: { email, redirectUrl, channel },
		}),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			requestPasswordReset?: {
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.requestPasswordReset;
	if (!result) {
		return authErrorResponse("unknown", 500);
	}

	// Always return ok: true — don't leak whether email exists
	return NextResponse.json({ ok: true });
}
