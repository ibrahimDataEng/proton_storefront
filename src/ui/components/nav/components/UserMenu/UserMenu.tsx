"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { UserIcon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/ui/context/AuthContext";

export function UserMenu() {
	const t = useTranslations("auth");
	const { user, isLoggedIn, openAuthModal, logout } = useAuth();

	if (!isLoggedIn || !user) {
		return (
			<button
				type="button"
				onClick={() => openAuthModal("login")}
				className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
				aria-label={t("login")}
			>
				<UserIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
				<span className="hidden sm:inline">{t("login")}</span>
			</button>
		);
	}

	const displayName = user.firstName || user.email;

	return (
		<Menu as="div" className="relative">
			<Menu.Button className="flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/20 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface-base">
				<UserIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
				<span className="hidden max-w-[10rem] truncate sm:inline">{displayName}</span>
			</Menu.Button>

			<Transition
				as={Fragment}
				enter="transition ease-out duration-100"
				enterFrom="transform opacity-0 scale-95"
				enterTo="transform opacity-100 scale-100"
				leave="transition ease-in duration-75"
				leaveFrom="transform opacity-100 scale-100"
				leaveTo="transform opacity-0 scale-95"
			>
				<Menu.Items className="origin-top-end absolute end-0 z-10 mt-2 w-52 divide-y divide-line-subtle rounded-xl bg-surface-base py-1 shadow-lg ring-1 ring-line-default focus:outline-none">
					<div className="px-4 py-3">
						<p className="truncate text-sm font-medium text-content-primary">{displayName}</p>
						<p className="truncate text-xs text-content-secondary">{user.email}</p>
					</div>

					<div className="py-1">
						<Menu.Item>
							{({ active }) => (
								<button
									type="button"
									onClick={logout}
									className={clsx(
										"flex w-full items-center gap-2 px-4 py-2 text-start text-sm text-content-secondary transition-colors",
										active && "bg-surface-sunken text-content-primary",
									)}
								>
									<LogOutIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
									{t("logout")}
								</button>
							)}
						</Menu.Item>
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	);
}
