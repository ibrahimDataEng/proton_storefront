"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type AuthUser } from "@/lib/auth/types";

type AuthModalMode = "login" | "register";

type AuthContextValue = {
	user: AuthUser | null;
	isLoggedIn: boolean;
	isAuthModalOpen: boolean;
	authModalMode: AuthModalMode;
	openAuthModal: (mode: AuthModalMode) => void;
	closeAuthModal: () => void;
	setAuthModalMode: (mode: AuthModalMode) => void;
	setUser: (user: AuthUser | null) => void;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
	children: ReactNode;
	initialUser?: AuthUser | null;
};

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
	const router = useRouter();
	const params = useParams();
	const channel = (params.channel as string) ?? "";
	const locale = (params.locale as string) ?? "en";
	const [user, setUser] = useState<AuthUser | null>(initialUser);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");
	const [logoutFailed, setLogoutFailed] = useState(false);
	const tAuth = useTranslations("auth");
	const tPhoneGate = useTranslations("phoneGate");

	const openAuthModal = useCallback((mode: AuthModalMode) => {
		setAuthModalMode(mode);
		setIsAuthModalOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsAuthModalOpen(false);
	}, []);

	useEffect(() => {
		if (!logoutFailed) return;
		const timer = setTimeout(() => setLogoutFailed(false), 8000);
		return () => clearTimeout(timer);
	}, [logoutFailed]);

	// The auth cookies are httpOnly — only /api/auth/logout can clear them. If that
	// request fails (offline, proxy 502), the customer is still signed in, so say
	// so (one notice here covers every sign-out button) instead of silently doing
	// nothing or pretending they're signed out.
	const logout = useCallback(async () => {
		setLogoutFailed(false);
		try {
			const res = await fetch("/api/auth/logout", { method: "POST" });
			if (!res.ok) throw new Error(`logout responded ${res.status}`);
		} catch {
			setLogoutFailed(true);
			return;
		}
		setUser(null);
		router.push(`/${locale}/${channel}`);
		router.refresh();
	}, [router, locale, channel]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoggedIn: user !== null,
				isAuthModalOpen,
				authModalMode,
				openAuthModal,
				closeAuthModal,
				setAuthModalMode,
				setUser,
				logout,
			}}
		>
			{children}
			{logoutFailed && (
				<div
					role="alert"
					className="fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-md items-start justify-between gap-3 rounded-lg border border-status-danger/30 bg-surface-raised px-4 py-3 text-sm text-status-danger shadow-lg md:bottom-6"
				>
					<p>{tAuth("signOutFailed")}</p>
					<button
						type="button"
						onClick={() => setLogoutFailed(false)}
						className="shrink-0 text-xs font-medium text-content-secondary underline-offset-2 hover:underline"
					>
						{tPhoneGate("dismiss")}
					</button>
				</div>
			)}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used inside <AuthProvider>");
	}
	return ctx;
}
