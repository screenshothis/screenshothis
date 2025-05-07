import { type VariantProps, tv } from "#/utils/tv";

export const progressBarVariants = tv({
	slots: {
		root: "h-1.5 w-full rounded-full bg-(--bg-soft-200)",
		progress: "h-full rounded-full transition-all duration-300 ease-out",
	},
	variants: {
		color: {
			blue: {
				progress: "bg-state-information-base",
			},
			red: {
				progress: "bg-state-error-base",
			},
			orange: {
				progress: "bg-state-warning-base",
			},
			green: {
				progress: "bg-state-success-base",
			},
		},
	},
	defaultVariants: {
		color: "blue",
	},
});

type ProgressBarRootProps = React.HTMLAttributes<HTMLDivElement> &
	VariantProps<typeof progressBarVariants> & {
		value?: number;
		max?: number;
	};

function ProgressBarRoot({
	className,
	color,
	value = 0,
	max = 100,
	...rest
}: ProgressBarRootProps) {
	const { root, progress } = progressBarVariants({ color });
	const safeValue = Math.min(max, Math.max(value, 0));

	return (
		<div className={root({ class: className })} {...rest}>
			<div
				className={progress()}
				style={{
					width: `${(safeValue / max) * 100}%`,
				}}
				aria-valuenow={value}
				aria-valuemax={max}
				aria-valuemin={0}
				role="progressbar"
				tabIndex={0}
			/>
		</div>
	);
}
ProgressBarRoot.displayName = "ProgressBarRoot";

export { ProgressBarRoot as Root };
