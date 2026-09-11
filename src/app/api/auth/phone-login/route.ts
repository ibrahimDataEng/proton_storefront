import { NextResponse, type NextRequest } from "next/server";
import { setAuthCookies } from "@/lib/auth/cookies";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL!;

// The proton_auth_plugin PLUGIN_ID, registered in Saleor — see that plugin's own
// README for the full external_obtain_access_tokens trust design.
const PHONE_AUTH_PLUGIN_ID = "com.tawasiplus.phone-auth";

const EXTERNAL_OBTAIN_ACCESS_TOKENS = `
  mutation PhoneLogin($pluginId: String!, $input: JSONString!) {
    externalObtainAccessTokens(pluginId: $pluginId, input: $input) {
      token
      refreshToken
      csrfToken
      user { id email firstName lastName }
      errors { field message code }
    }
  }
`;

type PhoneLoginInput = { phone: string; code: string };

export async function POST(request: NextRequest) {
	const body = (await request.json()) as Partial<PhoneLoginInput>;
	const phone = typeof body.phone === "string" ? body.phone.trim() : "";
	const code = typeof body.code === "string" ? body.code.trim() : "";

	if (!phone || !code) {
		return NextResponse.json({ error: "PHONE_CODE_REQUIRED" }, { status: 400 });
	}

	// externalObtainAccessTokens is a public mutation, same trust level as
	// tokenCreate — no SERVICE_TOKEN involved here. The actual verification against
	// proton_identity happens server-to-server inside the Saleor plugin itself, not
	// in this route.
	const saleorRes = await fetch(SALEOR_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: EXTERNAL_OBTAIN_ACCESS_TOKENS,
			variables: { pluginId: PHONE_AUTH_PLUGIN_ID, input: JSON.stringify({ phone, code }) },
		}),
		cache: "no-store",
	});

	const json = (await saleorRes.json()) as {
		data?: {
			externalObtainAccessTokens?: {
				token?: string | null;
				refreshToken?: string | null;
				user?: { id: string; email: string; firstName: string; lastName: string } | null;
				errors: { field: string | null; message: string; code: string }[];
			};
		};
	};

	const result = json.data?.externalObtainAccessTokens;

	// Deliberately ONE outcome for every failure mode: a GraphQL-level error, an
	// empty result (wrong code, expired code, already-consumed code, or a
	// genuinely-verified phone with no linked account), or an unexpected response
	// shape. proton_auth_plugin already collapses all of these into the identical
	// empty ExternalAccessTokens specifically to avoid letting a caller enumerate
	// which phone numbers exist or are mid-verification — this route must preserve
	// that ambiguity, not undo it by being more specific about which case occurred.
	if (!result || result.errors.length > 0 || !result.token || !result.refreshToken || !result.user) {
		return NextResponse.json({ error: "INVALID_OR_EXPIRED_CODE" }, { status: 401 });
	}

	const response = NextResponse.json({ user: result.user });
	setAuthCookies(response, result.token, result.refreshToken);
	return response;
}
