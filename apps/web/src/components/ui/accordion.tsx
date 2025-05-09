"use client";

import Add01Icon from "virtual:icons/hugeicons/add-01";
import MinusSignIcon from "virtual:icons/hugeicons/minus-sign";

import { Accordion as AccordionPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "#/utils/cn.ts";
import type { PolymorphicComponentProps } from "#/utils/polymorphic.ts";

const ACCORDION_ITEM_NAME = "AccordionItem";
const ACCORDION_ICON_NAME = "AccordionIcon";
const ACCORDION_ARROW_NAME = "AccordionArrow";
const ACCORDION_TRIGGER_NAME = "AccordionTrigger";
const ACCORDION_CONTENT_NAME = "AccordionContent";

const AccordionRoot = AccordionPrimitive.Root;
const AccordionHeader = AccordionPrimitive.Header;

const AccordionItem = React.forwardRef<
	React.ComponentRef<typeof AccordionPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...rest }, forwardedRef) => {
	return (
		<AccordionPrimitive.Item
			ref={forwardedRef}
			className={cn(
				// base
				"group/accordion",
				"rounded-10 bg-(--bg-white-0) p-3.5 ring-(--stroke-soft-200) ring-1 ring-inset",
				"transition duration-200 ease-out",
				// hover
				"hover:bg-(--bg-weak-50) hover:ring-transparent",
				// has-focus-visible
				"has-[:focus-visible]:bg-(--bg-weak-50) has-[:focus-visible]:ring-transparent",
				// open
				"data-[state=open]:bg-(--bg-weak-50) data-[state=open]:ring-transparent",
				className,
			)}
			{...rest}
		/>
	);
});
AccordionItem.displayName = ACCORDION_ITEM_NAME;

const AccordionTrigger = React.forwardRef<
	React.ComponentRef<typeof AccordionPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ children, className, ...rest }, forwardedRef) => {
	return (
		<AccordionPrimitive.Trigger
			ref={forwardedRef}
			className={cn(
				// base
				"w-[calc(100%+theme(space.7))] text-left text-(--text-strong-950) text-label-sm",
				"grid auto-cols-auto grid-flow-col grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5",
				"-m-3.5 p-3.5 outline-none",
				// focus
				"focus:outline-none",
				className,
			)}
			{...rest}
		>
			{children}
		</AccordionPrimitive.Trigger>
	);
});
AccordionTrigger.displayName = ACCORDION_TRIGGER_NAME;

function AccordionIcon<T extends React.ElementType>({
	className,
	as,
	...rest
}: PolymorphicComponentProps<T>) {
	const Component = as || "div";

	return (
		<Component
			className={cn("size-5 text-(--text-sub-600)", className)}
			{...rest}
		/>
	);
}
AccordionIcon.displayName = ACCORDION_ICON_NAME;

type AccordionArrowProps = React.HTMLAttributes<HTMLDivElement> & {
	openIcon?: React.ElementType;
	closeIcon?: React.ElementType;
};

// open/close
function AccordionArrow({
	className,
	openIcon: OpenIcon = Add01Icon,
	closeIcon: CloseIcon = MinusSignIcon,
	...rest
}: AccordionArrowProps) {
	return (
		<>
			<OpenIcon
				className={cn(
					"size-5 text-(--text-soft-400)",
					"transition duration-200 ease-out",
					// hover
					"group-hover/accordion:text-(--text-sub-600)",
					// open
					"group-data-[state=open]/accordion:hidden",
					className,
				)}
				{...rest}
			/>
			<CloseIcon
				className={cn(
					"size-5 text-(--text-sub-600)",
					// close
					"hidden group-data-[state=open]/accordion:block",
					className,
				)}
				{...rest}
			/>
		</>
	);
}
AccordionArrow.displayName = ACCORDION_ARROW_NAME;

const AccordionContent = React.forwardRef<
	React.ComponentRef<typeof AccordionPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ children, className, ...rest }, forwardedRef) => {
	return (
		<AccordionPrimitive.Content
			ref={forwardedRef}
			className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			{...rest}
		>
			<div
				className={cn(
					"pt-1.5 text-(--text-sub-600) text-paragraph-sm",
					className,
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
});
AccordionContent.displayName = ACCORDION_CONTENT_NAME;

export {
	AccordionArrow as Arrow,
	AccordionContent as Content,
	AccordionHeader as Header,
	AccordionIcon as Icon,
	AccordionItem as Item,
	AccordionRoot as Root,
	AccordionTrigger as Trigger,
};
