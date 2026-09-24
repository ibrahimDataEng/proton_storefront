import { NextResponse, type NextRequest } from "next/server";
import { type AuthErrorCode } from "@/lib/auth/errorCodes";
import { authErrorResponse } from "@/lib/auth/errorResponse";
import { getTokenFromRequest } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

const PASSWORD_CHANGE = `
  mutation PasswordChange($oldPassword: String!, $newPassword: String!) {
    passwordChange(oldPassword: $oldPassword, newPassword: $newPassword) {
      errors { field message code }
    }
  }
`;

const ERROR_MAP: Record<string, AuthErrorCode> = {
	INVALID_PASSWORD: "INVALID_PASSWORD",
	PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
	PASSWORD_TOO_SIMILAR: "PASSWORD_TOO_SIMILAR",
	PASSWORD_TOO_COMMON: "PASSWORD_TOO_COMMON",
	PASSWORD_ENTIRELY_NUMERIC: "PASSWORD_ENTIRELY_NUMERIC",
};

export async function POST(request: NextRequest) {
	const token = getTokenFromRequest(request);

	if (!token) {
		return authErrorResponse("unauthorized", 401);
	}

	const { oldPassword, newPassword } = (await request.json()) as {
		oldPassword: string;
		newPassword: string;
	};

	if (!oldPassword || !newPassword) {
		return authErrorResponse("unknown", 400);
	}

	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			query: PASSWORD_CHANGE,
			variables: { oldPassword, newPassword },
		}),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			passwordChange?: {
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.passwordChange;
	if (!result) {
		return authErrorResponse("unknown", 500);
	}

	if (result.errors.length > 0) {
		const code = result.errors[0].code;
		return authErrorResponse(ERROR_MAP[code] ?? "unknown", 400);
	}

	return NextResponse.json({ ok: true });
}
