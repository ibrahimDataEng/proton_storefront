"use client";

import { LogOutIcon } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { Button } from "@/ui/components/Button";

type Props = {
	label: string;
};

export function SignOutButton({ label }: Props) {
	const { logout } = useAuth();

	return (
		<Button type="button" variant="secondary" size="sm" onClick={logout} className="w-full">
			<LogOutIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
			{label}
		</Button>
	);
}
