type JwtPayload = {
	exp: number;
	email: string;
	[key: string]: unknown;
};

export function decodeJwtPayload(token: string): JwtPayload {
	const base64Url = token.split(".")[1];
	if (!base64Url) throw new Error("Invalid JWT token");
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	return JSON.parse(atob(base64)) as JwtPayload;
}

export function isTokenExpiringSoon(token: string, thresholdSeconds = 300): boolean {
	try {
		const { exp } = decodeJwtPayload(token);
		return exp - Date.now() / 1000 < thresholdSeconds;
	} catch {
		return true;
	}
}
