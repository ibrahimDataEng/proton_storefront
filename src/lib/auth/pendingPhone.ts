// Best-effort, same-device carry-forward for the phone value captured at
// registration, used only on the confirmation-required path (no access token exists
// yet at registration time, so nothing can be written to proton_identity until the
// user actually logs in post-confirmation — see RegisterForm.tsx / LoginForm.tsx).
//
// This is deliberately NOT the correctness guarantee for "every user ends up with a
// phone on file" — PhoneGate (the login-gate) is that guarantee, and works
// regardless of device. This module only spares the common same-device case a
// redundant prompt: most people confirm their email on the same browser they
// registered in. If they confirm on a different device (e.g. click the email link on
// their phone after registering on desktop), this localStorage entry simply isn't
// there, and PhoneGate is what catches it, exactly as it would for any other user
// with no phone on file.

const KEY_PREFIX = "pendingPhone:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — well past any realistic confirm-email delay

type PendingPhoneEntry = { phone: string; savedAt: number };

function storageKey(email: string): string {
	return `${KEY_PREFIX}${email.trim().toLowerCase()}`;
}

export function savePendingPhone(email: string, phone: string): void {
	try {
		const entry: PendingPhoneEntry = { phone, savedAt: Date.now() };
		localStorage.setItem(storageKey(email), JSON.stringify(entry));
	} catch {
		// localStorage unavailable (private mode, storage full, etc.) — PhoneGate remains
		// the guaranteed fallback regardless, so this is safe to just drop.
	}
}

export function getPendingPhone(email: string): string | null {
	try {
		const raw = localStorage.getItem(storageKey(email));
		if (!raw) return null;
		const entry = JSON.parse(raw) as PendingPhoneEntry;
		if (Date.now() - entry.savedAt > TTL_MS) {
			localStorage.removeItem(storageKey(email));
			return null;
		}
		return entry.phone || null;
	} catch {
		return null;
	}
}

/** Called once PhoneGate takes over (it mounted and found hasPhone:false) or once the flush succeeds — either way, responsibility has moved on and this entry would otherwise just cause redundant silent attempts on every future login. */
export function clearPendingPhone(email: string | undefined | null): void {
	if (!email) return;
	try {
		localStorage.removeItem(storageKey(email));
	} catch {
		// ignore
	}
}
