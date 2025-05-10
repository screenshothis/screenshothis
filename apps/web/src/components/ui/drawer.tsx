import Cancel01Icon from "virtual:icons/hugeicons/cancel-01";

import { Dialog as DialogPrimitive } from "radix-ui";

import * as CompactButton from "#/components/ui/compact-button.tsx";
import { cn } from "#/utils/cn.ts";

const DrawerRoot = DialogPrimitive.Root;
DrawerRoot.displayName = "Drawer";

const DrawerTrigger = DialogPrimitive.Trigger;
DrawerTrigger.displayName = "DrawerTrigger";

const DrawerClose = DialogPrimitive.Close;
DrawerClose.displayName = "DrawerClose";

const DrawerPortal = DialogPrimitive.Portal;
DrawerPortal.displayName = "DrawerPortal";

function DrawerOverlay({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				// base
				"fixed inset-0 z-50 grid grid-cols-1 place-items-end overflow-hidden bg-overlay backdrop-blur-[10px]",
				// animation
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...rest}
		/>
	);
}
DrawerOverlay.displayName = "DrawerOverlay";

function DrawerContent({
	className,
	children,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Content>) {
	return (
		<DrawerPortal>
			<DrawerOverlay>
				<DialogPrimitive.Content
					className={cn(
						// base
						"size-full max-w-[400px] overflow-y-auto",
						"border-(--stroke-soft-200) border-l bg-(--bg-white-0)",
						// animation
						"data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=open]:ease-out",
						"data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in",
						"data-[state=open]:slide-in-from-right-full",
						"data-[state=closed]:slide-out-to-right-full",
						className,
					)}
					{...rest}
				>
					<div className="relative flex size-full flex-col">{children}</div>
				</DialogPrimitive.Content>
			</DrawerOverlay>
		</DrawerPortal>
	);
}
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({
	className,
	children,
	showCloseButton = true,
	...rest
}: React.HTMLAttributes<HTMLDivElement> & {
	showCloseButton?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 border-(--stroke-soft-200) p-5",
				className,
			)}
			{...rest}
		>
			<div className="flex flex-col gap-1">{children}</div>

			{showCloseButton && (
				<DrawerClose asChild>
					<CompactButton.Root $size="lg" $style="ghost">
						<CompactButton.Icon as={Cancel01Icon} className="size-4" />
					</CompactButton.Root>
				</DrawerClose>
			)}
		</div>
	);
}
DrawerHeader.displayName = "DrawerHeader";

function DrawerTitle({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("flex-1 text-(--text-strong-950) text-label-lg", className)}
			{...rest}
		/>
	);
}
DrawerTitle.displayName = "DrawerTitle";

function DrawerDescription({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-(--text-sub-600) text-label-sm", className)}
			{...rest}
		/>
	);
}
DrawerDescription.displayName = "DrawerDescription";

function DrawerBody({
	className,
	children,
	...rest
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex-1", className)} {...rest}>
			{children}
		</div>
	);
}
DrawerBody.displayName = "DrawerBody";

function DrawerFooter({
	className,
	...rest
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex items-center gap-4 border-(--stroke-soft-200) p-5",
				className,
			)}
			{...rest}
		/>
	);
}
DrawerFooter.displayName = "DrawerFooter";

export {
	DrawerBody as Body,
	DrawerClose as Close,
	DrawerContent as Content,
	DrawerDescription as Description,
	DrawerFooter as Footer,
	DrawerHeader as Header,
	DrawerRoot as Root,
	DrawerTitle as Title,
	DrawerTrigger as Trigger,
};
