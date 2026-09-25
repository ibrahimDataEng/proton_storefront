import { NextResponse } from "next/server";
import { type AuthErrorCode } from "./errorCodes";

/** The only way an auth route should return an error — the code is type-checked against AUTH_ERROR_CODES. */
export function authErrorResponse(error: AuthErrorCode, status: number) {
	return NextResponse.json({ error }, { status });
}
