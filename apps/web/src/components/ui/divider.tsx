import { type VariantProps, tv } from "#/utils/tv.ts";

const DIVIDER_ROOT_NAME = "DividerRoot";

export const dividerVariants = tv({
	base: "relative flex w-full items-center",
	variants: {
		$type: {
			line: "before:-translate-y-1/2 h-0 before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-(--stroke-soft-200)",
			"line-spacing": [
				// base
				"h-1",
				// before
				"before:-translate-y-1/2 before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:bg-(--stroke-soft-200)",
			],
			"line-text": [
				// base
				"gap-2.5",
				"text-(--text-soft-400) text-subheading-2xs",
				// before
				"before:h-px before:w-full before:flex-1 before:bg-(--stroke-soft-200)",
				// after
				"after:h-px after:w-full after:flex-1 after:bg-(--stroke-soft-200)",
			],
			content: [
				// base
				"gap-2.5",
				// before
				"before:h-px before:w-full before:flex-1 before:bg-(--stroke-soft-200)",
				// after
				"after:h-px after:w-full after:flex-1 after:bg-(--stroke-soft-200)",
			],
			text: [
				// base
				"px-2 py-1",
				"text-(--text-soft-400) text-subheading-xs",
			],
			"solid-text": [
				// base
				"bg-(--bg-weak-50) px-5 py-1.5 uppercase",
				"text-(--text-soft-400) text-subheading-xs",
			],
		},
	},
	defaultVariants: {
		$type: "line",
	},
});

function Divider({
	className,
	$type,
	...rest
}: React.HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof dividerVariants>) {
	return (
		<div
			className={dividerVariants({ $type, class: className })}
			role="separator"
			{...rest}
		/>
	);
}
Divider.displayName = DIVIDER_ROOT_NAME;

export { Divider as Root };
