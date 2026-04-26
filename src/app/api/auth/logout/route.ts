import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, getTokenFromRequest } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const TOKENS_DEACTIVATE_ALL = `
  mutation TokensDeactivateAll {
    tokensDeactivateAll {
      errors { field message code }
    }
  }
`;

export async function POST(request: NextRequest) {
	const token = getTokenFromRequest(request);

	if (token) {
		// Best-effort: invalidate all tokens on the Saleor side
		await fetch(SALEOR_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ query: TOKENS_DEACTIVATE_ALL }),
			cache: "no-store",
		}).catch(() => {
			// Swallow errors — we clear cookies regardless
		});
	}

	const response = NextResponse.json({ ok: true });
	clearAuthCookies(response);
	return response;
}
