/**
 * NEXT_PUBLIC_PHONE_LOGIN_ENABLED gates the phone/OTP login UI (identifier-field
 * detection, "Send code" flow) across LoginForm and PhoneGate's sibling flows.
 * Off by default: proton_identity's SMS delivery is still a dev-stub (no real SMS
 * provider wired in production — see CLAUDE.md), so phone login must stay hidden
 * from real customers until that's in place. Flip to "true" to re-expose it with
 * zero code changes.
 */
export const PHONE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_PHONE_LOGIN_ENABLED === "true";
