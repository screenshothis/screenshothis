"use client";

import CreditCardIcon from "virtual:icons/hugeicons/credit-card";
import SecurityLockIcon from "virtual:icons/hugeicons/security-lock";
import ToggleOnIcon from "virtual:icons/hugeicons/toggle-on";
import UserIcon from "virtual:icons/hugeicons/user";
import UserGroupIcon from "virtual:icons/hugeicons/user-group";

import { Tabs as TabPrimitives } from "radix-ui";
import * as React from "react";

type PersonalSettingKeys = "account" | "privacy-security" | "integrations";
type GeneralSettingKeys = "workspace" | "billing";
type AllSettingKeys = PersonalSettingKeys | GeneralSettingKeys;

type SettingPageItem = {
	group: string;
	items: {
		[K in AllSettingKeys]?: {
			icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
			label: string;
		};
	};
};

const settingPageItems: SettingPageItem[] = [
	{
		group: "PERSONAL SETTINGS",
		items: {
			account: {
				icon: UserIcon,
				label: "Account Settings",
			},
			"privacy-security": {
				icon: SecurityLockIcon,
				label: "Privacy & Security",
			},
			integrations: {
				icon: ToggleOnIcon,
				label: "Integrations",
			},
		},
	},
	{
		group: "GENERAL SETTINGS",
		items: {
			workspace: {
				icon: UserGroupIcon,
				label: "Workspace Settings",
			},
			billing: {
				icon: CreditCardIcon,
				label: "Payment & Billing",
			},
		},
	},
] as const;

type SettingPageKeys = keyof (typeof settingPageItems)[number]["items"];

export function SettingsContent() {
	const [activePage, setActivePage] =
		React.useState<SettingPageKeys>("account");

	return <TabPrimitives.Root>{/*  */}</TabPrimitives.Root>;
}
