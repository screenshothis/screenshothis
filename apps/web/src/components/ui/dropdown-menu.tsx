"use client";

import ArrowRight01Icon from "virtual:icons/hugeicons/arrow-right-01";

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

import { cn } from "#/utils/cn.ts";
import type { PolymorphicComponentProps } from "#/utils/polymorphic.ts";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuCheckboxItem = DropdownMenuPrimitive.CheckboxItem;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
const DropdownMenuRadioItem = DropdownMenuPrimitive.RadioItem;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;
const DropdownMenuArrow = DropdownMenuPrimitive.Arrow;

function DropdownMenuContent({
	className,
	sideOffset = 8,
	...rest
}: React.CustomComponentPropsWithRef<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				className={cn(
					"z-50 w-[300px] overflow-hidden rounded-16 bg-(--bg-white-0) p-2 shadow-md ring-(--stroke-soft-200) ring-1 ring-inset",
					"flex flex-col gap-1",
					// origin
					"data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left data-[side=top]:origin-bottom",
					// animation
					"data-[state=open]:fade-in-0 data-[state=open]:animate-in",
					"data-[state=closed]:fade-out-0 data-[state=closed]:animate-out",
					"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				sideOffset={sideOffset}
				{...rest}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	inset,
	...rest
}: React.CustomComponentPropsWithRef<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				// base
				"group/item relative cursor-pointer select-none rounded-8 p-2 text-(--text-strong-950) text-paragraph-sm outline-none",
				"flex items-center gap-2",
				"transition duration-200 ease-out",
				// hover
				"hover:bg-(--bg-weak-50) data-[highlighted]:bg-(--bg-weak-50)",
				// focus
				"focus:outline-none",
				// disabled
				"data-[disabled]:text-(--text-disabled-300)",
				inset && "pl-9",
				className,
			)}
			{...rest}
		/>
	);
}

function DropdownItemIcon<T extends React.ElementType>({
	className,
	as,
	...rest
}: PolymorphicComponentProps<T>) {
	const Component = as || "div";

	return (
		<Component
			className={cn(
				// base
				"size-5 text-(--text-sub-600)",
				// disabled
				"group-has-[[data-disabled]]:text-(--text-disabled-300)",
				className,
			)}
			{...rest}
		/>
	);
}

function DropdownMenuGroup({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DropdownMenuPrimitive.Group>) {
	return (
		<DropdownMenuPrimitive.Group
			className={cn("flex flex-col gap-1", className)}
			{...rest}
		/>
	);
}

function DropdownMenuLabel({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DropdownMenuPrimitive.Label>) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn(
				"px-2 py-1 text-(--text-soft-400) text-subheading-xs uppercase",
				className,
			)}
			{...rest}
		/>
	);
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...rest
}: React.CustomComponentPropsWithRef<
	typeof DropdownMenuPrimitive.SubTrigger
> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.SubTrigger
			className={cn(
				// base
				"group/item relative cursor-pointer select-none rounded-8 p-2 text-(--text-strong-950) text-paragraph-sm outline-0",
				"flex items-center gap-2",
				"transition duration-200 ease-out",
				// hover
				"data-[highlighted]:bg-(--bg-weak-50)",
				// disabled
				"data-[disabled]:text-(--text-disabled-300)",
				inset && "pl-9",
				className,
			)}
			{...rest}
		>
			{children}
			<span className="flex-1" />
			<DropdownItemIcon as={ArrowRight01Icon} />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

function DropdownMenuSubContent({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.SubContent
			className={cn(
				"z-50 w-max overflow-hidden rounded-16 bg-(--bg-white-0) p-2 shadow-md ring-(--stroke-soft-200) ring-1 ring-inset",
				"flex flex-col gap-1",
				// animation
				"data-[state=open]:fade-in-0 data-[state=open]:animate-in",
				"data-[state=closed]:fade-out-0 data-[state=closed]:animate-out",
				"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
				"data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				className,
			)}
			{...rest}
		/>
	);
}

export {
	DropdownMenuArrow as Arrow,
	DropdownMenuCheckboxItem as CheckboxItem,
	DropdownMenuContent as Content,
	DropdownMenuGroup as Group,
	DropdownMenuItem as Item,
	DropdownItemIcon as ItemIcon,
	DropdownMenuLabel as Label,
	DropdownMenuSub as MenuSub,
	DropdownMenuSubContent as MenuSubContent,
	DropdownMenuSubTrigger as MenuSubTrigger,
	DropdownMenuPortal as Portal,
	DropdownMenuRadioGroup as RadioGroup,
	DropdownMenuRadioItem as RadioItem,
	DropdownMenu as Root,
	DropdownMenuSeparator as Separator,
	DropdownMenuTrigger as Trigger,
};
