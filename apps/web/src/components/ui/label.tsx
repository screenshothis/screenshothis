import { Label as LabelPrimitives } from "radix-ui";

import { cn } from "#/utils/cn.ts";

type LabelRootProps = React.ComponentPropsWithoutRef<
	typeof LabelPrimitives.Root
> & {
	disabled?: boolean;
};

function LabelRoot({ className, ...props }: LabelRootProps) {
	return (
		<LabelPrimitives.Root
			className={cn(
				"group flex cursor-pointer items-center gap-px text-label-sm aria-disabled:text-(--text-disabled-300)",
				{
					"aria-disabled pointer-events-none": props.disabled,
				},
				className,
			)}
			tabIndex={props.disabled ? -1 : undefined}
			{...props}
		/>
	);
}

function LabelAsterisk({
	className,
	...props
}: React.ComponentPropsWithRef<"span">) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"text-primary group-aria-disabled:text-(--text-disabled-300)",
				className,
			)}
			{...props}
		>
			*
		</span>
	);
}

function LabelSub({
	className,
	...props
}: React.ComponentPropsWithRef<"span">) {
	return (
		<span
			className={cn(
				"text-(--text-sub-600) text-paragraph-sm group-aria-disabled:text-(--text-disabled-300)",
				className,
			)}
			{...props}
		/>
	);
}

export { LabelAsterisk as Asterisk, LabelRoot as Root, LabelSub as Sub };
