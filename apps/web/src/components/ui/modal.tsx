import Cancel01Icon from "virtual:icons/hugeicons/cancel-01";

import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "#/utils/cn.ts";
import * as CompactButton from "./compact-button.tsx";

const ModalRoot = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;
const ModalPortal = DialogPrimitive.Portal;

function ModalOverlay({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				// base
				"fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-overlay p-4 backdrop-blur-[10px]",
				// animation
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...rest}
		/>
	);
}

function ModalContent({
	className,
	overlayClassName,
	children,
	showClose = true,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Content> & {
	overlayClassName?: string;
	showClose?: boolean;
}) {
	return (
		<ModalPortal>
			<ModalOverlay className={overlayClassName}>
				<DialogPrimitive.Content
					className={cn(
						// base
						"relative w-full max-w-[400px]",
						"rounded-20 bg-(--bg-white-0) shadow-md",
						// focus
						"focus:outline-none",
						// animation
						"data-[state=closed]:animate-out data-[state=open]:animate-in",
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
						"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
						className,
					)}
					{...rest}
				>
					{children}
					{showClose && (
						<ModalClose asChild>
							<CompactButton.Root
								$size="lg"
								$style="ghost"
								className="absolute top-4 right-4"
							>
								<CompactButton.Icon as={Cancel01Icon} />
							</CompactButton.Root>
						</ModalClose>
					)}
				</DialogPrimitive.Content>
			</ModalOverlay>
		</ModalPortal>
	);
}

function ModalHeader({
	className,
	children,
	icon: Icon,
	title,
	description,
	...rest
}: React.HTMLAttributes<HTMLDivElement> & {
	icon?: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
	title?: string;
	description?: string;
}) {
	return (
		<div
			className={cn(
				"relative flex items-start gap-3.5 py-4 pr-14 pl-5 before:absolute before:inset-x-0 before:bottom-0 before:border-(--stroke-soft-200) before:border-b",
				className,
			)}
			{...rest}
		>
			{children || (
				<>
					{Icon && (
						<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--bg-white-0) ring-(--stroke-soft-200) ring-1 ring-inset">
							<Icon className="size-5 text-(--text-sub-600)" />
						</div>
					)}
					{(title || description) && (
						<div className="flex-1 space-y-1">
							{title && <ModalTitle>{title}</ModalTitle>}
							{description && (
								<ModalDescription>{description}</ModalDescription>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}

function ModalTitle({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("text-(--text-strong-950) text-label-sm", className)}
			{...rest}
		/>
	);
}

function ModalDescription({
	className,
	...rest
}: React.CustomComponentPropsWithRef<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-(--text-sub-600) text-paragraph-xs", className)}
			{...rest}
		/>
	);
}

function ModalBody({
	className,
	...rest
}: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-5", className)} {...rest} />;
}

function ModalFooter({
	className,
	...rest
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 border-(--stroke-soft-200) border-t px-5 py-4",
				className,
			)}
			{...rest}
		/>
	);
}

ModalFooter.displayName = "ModalFooter";

export {
	ModalBody as Body,
	ModalClose as Close,
	ModalContent as Content,
	ModalDescription as Description,
	ModalFooter as Footer,
	ModalHeader as Header,
	ModalOverlay as Overlay,
	ModalPortal as Portal,
	ModalRoot as Root,
	ModalTitle as Title,
	ModalTrigger as Trigger,
};
