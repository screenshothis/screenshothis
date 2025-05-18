"use client";

import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";
import CreditCardIcon from "virtual:icons/hugeicons/credit-card";
import SecurityLockIcon from "virtual:icons/hugeicons/security-lock";
import ToggleOnIcon from "virtual:icons/hugeicons/toggle-on";
import UserIcon from "virtual:icons/hugeicons/user";
import UserGroupIcon from "virtual:icons/hugeicons/user-group";

import { Tabs as TabPrimitives } from "radix-ui";
import * as React from "react";

import * as Divider from "#/components/ui/divider.tsx";
import * as Select from "#/components/ui/select.tsx";
import { cn } from "#/utils/cn.ts";
import { AccountSettings } from "./settings/account.tsx";

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

	return (
		<TabPrimitives.Root
			value={activePage}
			onValueChange={(v) => setActivePage(v as SettingPageKeys)}
			orientation="vertical"
			className="flex w-full flex-col lg:flex-row"
		>
			<TabPrimitives.List className="hidden w-64 shrink-0 flex-col gap-4 border-(--stroke-soft-200) border-r p-4 lg:flex">
				{settingPageItems.map(({ group, items }, i, arr) => (
					<React.Fragment key={group}>
						<div className="flex flex-col gap-2">
							<Divider.Root $type="text">{group}</Divider.Root>
							{Object.entries(items).map(([key, v]) => {
								const Icon = v.icon;

								return (
									<TabPrimitives.Trigger
										key={key}
										value={key}
										className={cn(
											"group flex h-9 w-full items-center gap-2 rounded-10 bg-(--bg-white-0) px-2 text-left text-(--text-sub-600) text-label-sm",
											"transition duration-200 ease-out",
											"hover:bg-(--bg-weak-50)",
											"focus:outline-none",
											{
												"bg-(--bg-weak-50) text-(--text-strong-950)":
													activePage === key,
											},
										)}
									>
										<Icon
											className={cn(
												"size-5 shrink-0 text-(--text-soft-400) transition duration-200 ease-out",
												{
													"text-primary": activePage === key,
													"group-hover:text-(--text-sub-600)":
														activePage !== key,
												},
											)}
										/>
										<div className="flex-1">{v.label}</div>
										{activePage === key && (
											<ArrowRight01Icon className="size-[18px] shrink-0 text-(--text-sub-600)" />
										)}
									</TabPrimitives.Trigger>
								);
							})}
						</div>
						{i < arr.length - 1 && <Divider.Root $type="line-spacing" />}
					</React.Fragment>
				))}
			</TabPrimitives.List>

			<div className="p-4 pb-0 lg:hidden">
				<Select.Root
					defaultValue={activePage}
					onValueChange={(v) => setActivePage(v as SettingPageKeys)}
				>
					<Select.Trigger>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{settingPageItems.map(({ group, items }) => (
							<Select.Group key={group}>
								<Select.GroupLabel className="mt-2 mb-1 px-2 py-1 text-(--text-soft-400) text-subheading-xs">
									{group}
								</Select.GroupLabel>
								{Object.entries(items).map(([key, v]) => {
									const Icon = v.icon;

									return (
										<Select.Item key={key} value={key}>
											<Select.ItemIcon as={Icon} />
											{v.label}
										</Select.Item>
									);
								})}
							</Select.Group>
						))}
					</Select.Content>
				</Select.Root>
			</div>

			<div className="w-full min-w-0">
				<TabPrimitives.Content className="fade-in animate-in" value="account">
					<AccountSettings />
				</TabPrimitives.Content>
			</div>
		</TabPrimitives.Root>
	);
}
