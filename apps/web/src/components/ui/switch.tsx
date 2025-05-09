import { Switch as SwitchPrimitives } from "radix-ui";

import { cn } from "#/utils/cn.ts";

export type SwitchProps = React.CustomComponentPropsWithRef<
	typeof SwitchPrimitives.Root
>;

function Switch({ className, disabled, ...rest }: SwitchProps) {
	return (
		<SwitchPrimitives.Root
			className={cn(
				"group/switch block h-5 w-8 shrink-0 p-0.5 outline-none focus:outline-none",
				className,
			)}
			disabled={disabled}
			{...rest}
		>
			<div
				className={cn(
					// base
					"h-4 w-7 rounded-full bg-(--bg-soft-200) p-0.5 outline-none",
					"transition duration-200 ease-out",
					!disabled && [
						// hover
						"group-hover/switch:bg-(--bg-sub-300)",
						// focus
						"group-focus-visible/switch:bg-(--bg-sub-300)",
						// pressed
						"group-active/switch:bg-(--bg-soft-200)",
						// checked
						"group-data-[state=checked]/switch:bg-primary",
						// checked hover
						"group-hover:data-[state=checked]/switch:bg-primary-darker",
						// checked pressed
						"group-active:data-[state=checked]/switch:bg-primary",
						// focus
						"group-focus/switch:outline-none",
					],
					// disabled
					disabled && [
						"bg-(--bg-white-0) p-[3px] ring-(--stroke-soft-200) ring-1 ring-inset",
					],
				)}
			>
				<SwitchPrimitives.Thumb
					className={cn(
						// base
						"pointer-events-none relative block size-3",
						"transition-transform duration-200 ease-out",
						// checked
						"data-[state=checked]:translate-x-3",
						!disabled && [
							// before
							"before:-translate-x-1/2 before:absolute before:inset-y-0 before:left-1/2 before:w-3 before:rounded-full before:bg-white",
							"before:[mask:var(--mask)]",
							// after
							"after:-translate-x-1/2 after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:rounded-full after:shadow-switch-thumb",
							// pressed
							"group-active/switch:scale-[.833]",
						],
						// disabled,
						disabled && [
							"size-2.5 rounded-full bg-(--bg-soft-200) shadow-none",
						],
					)}
					style={{
						"--mask":
							"radial-gradient(circle farthest-side at 50% 50%, #0000 1.95px, #000 2.05px 100%) 50% 50%/100% 100% no-repeat",
					}}
				/>
			</div>
		</SwitchPrimitives.Root>
	);
}
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch as Root };
