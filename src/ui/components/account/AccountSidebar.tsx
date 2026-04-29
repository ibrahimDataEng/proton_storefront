"use client";

import { LayoutDashboard, ShoppingBag, MapPin, Settings, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/ui/context/AuthContext";

export type AccountSection = "overview" | "orders" | "addresses" | "settings";

interface Props {
	initials: string;
	fullName: string;
	email: string;
	activeSection: AccountSection;
	onSectionChange: (section: AccountSection) => void;
	labels: {
		overview: string;
		orders: string;
		addresses: string;
		settings: string;
		signOut: string;
	};
}

const navItems: { id: AccountSection; Icon: React.ElementType; labelKey: keyof Props["labels"] }[] = [
	{ id: "overview", Icon: LayoutDashboard, labelKey: "overview" },
	{ id: "orders", Icon: ShoppingBag, labelKey: "orders" },
	{ id: "addresses", Icon: MapPin, labelKey: "addresses" },
	{ id: "settings", Icon: Settings, labelKey: "settings" },
];

export function AccountSidebar({ initials, fullName, email, activeSection, onSectionChange, labels }: Props) {
	const { logout } = useAuth();

	return (
		<>
			{/* Desktop sidebar */}
			<aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
				<div className="rounded-2xl bg-surface-base p-6 ring-1 ring-line-subtle">
					<div className="flex flex-col items-center gap-3 border-b border-line-subtle pb-5">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-2xl font-bold text-content-inverse">
							{initials}
						</div>
						<div className="text-center">
							{fullName && <p className="text-sm font-semibold text-content-primary">{fullName}</p>}
							<p className="text-xs text-content-secondary">{email}</p>
						</div>
					</div>
					<nav className="mt-4 flex flex-col gap-1">
						{navItems.map(({ id, Icon, labelKey }) => (
							<button
								key={id}
								type="button"
								onClick={() => onSectionChange(id)}
								className={clsx(
									"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
									activeSection === id
										? "bg-brand-primary text-content-inverse"
										: "text-content-secondary hover:bg-surface-sunken hover:text-content-primary",
								)}
							>
								<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
								{labels[labelKey]}
							</button>
						))}
					</nav>
					<div className="mt-4 border-t border-line-subtle pt-4">
						<button
							type="button"
							onClick={logout}
							className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-red-50 hover:text-red-600"
						>
							<LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
							{labels.signOut}
						</button>
					</div>
				</div>
			</aside>

			{/* Mobile tab bar */}
			<div className="flex overflow-x-auto border-b border-line-subtle pb-0 lg:hidden">
				{navItems.map(({ id, Icon, labelKey }) => (
					<button
						key={id}
						type="button"
						onClick={() => onSectionChange(id)}
						className={clsx(
							"flex shrink-0 flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors",
							activeSection === id
								? "border-b-2 border-brand-primary text-brand-primary"
								: "text-content-secondary hover:text-content-primary",
						)}
					>
						<Icon className="h-5 w-5" aria-hidden="true" />
						{labels[labelKey]}
					</button>
				))}
			</div>
		</>
	);
}
