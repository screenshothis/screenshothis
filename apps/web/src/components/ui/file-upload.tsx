import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "#/utils/cn.ts";
import type { PolymorphicComponentProps } from "#/utils/polymorphic.ts";

function FileUpload({
	className,
	asChild,
	...rest
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
	asChild?: boolean;
}) {
	const Component = asChild ? Slot.Slot : "label";

	return (
		<Component
			className={cn(
				"flex w-full cursor-pointer flex-col items-center gap-5 rounded-xl border border-(--stroke-sub-300) border-dashed bg-(--bg-white-0) p-8 text-center",
				"transition duration-200 ease-out",
				// hover
				"hover:bg-(--bg-weak-50)",
				className,
			)}
			{...rest}
		/>
	);
}
FileUpload.displayName = "FileUpload";

function FileUploadButton({
	className,
	asChild,
	...rest
}: React.HTMLAttributes<HTMLDivElement> & {
	asChild?: boolean;
}) {
	const Component = asChild ? Slot.Slot : "div";

	return (
		<Component
			className={cn(
				"inline-flex h-8 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg bg-(--bg-white-0) px-2.5 text-(--text-sub-600) text-label-sm",
				"pointer-events-none ring-(--stroke-soft-200) ring-1 ring-inset",
				className,
			)}
			{...rest}
		/>
	);
}
FileUploadButton.displayName = "FileUploadButton";

function FileUploadIcon<T extends React.ElementType>({
	className,
	as,
	...rest
}: PolymorphicComponentProps<T>) {
	const Component = as || "div";

	return (
		<Component
			className={cn("size-6 text-(--text-sub-600)", className)}
			{...rest}
		/>
	);
}

export {
	FileUploadButton as Button,
	FileUploadIcon as Icon,
	FileUpload as Root,
};
