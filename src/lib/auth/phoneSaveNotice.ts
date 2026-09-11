// A plain window event, not AuthContext state, because the notifier
// (RegisterForm's fire-and-forget write, see RegisterForm.tsx) can resolve *after*
// router.refresh() has already remounted AuthProvider — confirmed live: the write
// failure was correctly detected (pendingPhone got saved) but a context-based
// setter call landed on the discarded pre-refresh AuthProvider instance and was
// silently lost. `window` has no such lifecycle — any PhoneSaveNoticeBanner mounted
// at the moment this fires (including a freshly remounted one) receives it.
export const PHONE_SAVE_NOTICE_EVENT = "phone-save-notice";

export function notifyPhoneSaveFailed(): void {
	try {
		window.dispatchEvent(new Event(PHONE_SAVE_NOTICE_EVENT));
	} catch {
		// window unavailable (shouldn't happen in a "use client" component, but this
		// is a courtesy notice, not the correctness guarantee — PhoneGate is) — skip.
	}
}
