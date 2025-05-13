import { cn } from "#/utils/cn.ts";

type AuthHeaderProps = {
	icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
	title: string;
	description: string;
};

export function AuthHeader({
	icon: Icon,
	title,
	description,
}: AuthHeaderProps) {
	return (
		<div className="flex flex-col items-center space-y-2">
			{/* icon */}
			<div
				className={cn(
					"relative flex size-[68px] shrink-0 items-center justify-center rounded-full backdrop-blur-xl lg:size-20",
					// bg
					"before:absolute before:inset-0 before:rounded-full",
					"before:bg-gradient-to-b before:from-primary before:to-transparent before:opacity-10",
				)}
			>
				<div
					className="relative z-10 flex size-12 items-center justify-center rounded-full bg-(--bg-white-0) ring-(--stroke-soft-200) ring-1 ring-inset lg:size-14"
					style={{
						boxShadow:
							"0 0 0 1px rgba(183, 83, 16, 0.04), 0 1px 1px 0.5px rgba(183, 83, 16, 0.04), 0 3px 3px -1.5px rgba(183, 83, 16, 0.02), 0 6px 6px -3px rgba(183, 83, 16, 0.04), 0 12px 12px -6px rgba(183, 83, 16, 0.04), 0px 24px 24px -12px rgba(183, 83, 16, 0.04), 0px 48px 48px -24px rgba(183, 83, 16, 0.04), inset 0px -1px 1px -0.5px rgba(183, 83, 16, 0.06)",
					}}
				>
					<Icon className="size-6 text-state-warning-base lg:size-7" />
				</div>
			</div>

			<div className="space-y-1 text-center">
				<div className="text-h6 lg:text-h5">{title}</div>
				<div className="text-(--text-sub-600) text-paragraph-sm lg:text-paragraph-md">
					{description}
				</div>
			</div>
		</div>
	);
}
