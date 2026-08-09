export type AuthUser = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};

export type AuthState = {
	user: AuthUser | null;
	isLoggedIn: boolean;
};
