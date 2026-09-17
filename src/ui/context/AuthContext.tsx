"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
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

	const openAuthModal = useCallback((mode: AuthModalMode) => {
		setAuthModalMode(mode);
		setIsAuthModalOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsAuthModalOpen(false);
	}, []);

	const logout = useCallback(async () => {
		await fetch("/api/auth/logout", { method: "POST" });
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
