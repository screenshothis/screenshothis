import { cn } from "#/utils/cn.ts";

export function DashedDivider({ className }: { className?: string }) {
	return (
		<div className={cn("relative h-0 w-full", className)}>
			<div
				className="-translate-y-1/2 absolute top-1/2 left-0 h-px w-full text-(--stroke-soft-200)"
				style={{
					background:
						"linear-gradient(90deg, currentColor 4px, transparent 4px) 50% 50% / 10px 1px repeat no-repeat",
				}}
			/>
		</div>
	);
}

export function DashedDividerVertical({ className }: { className?: string }) {
	return (
		<div className={cn("relative w-0", className)}>
			<div
				className="-translate-x-1/2 absolute top-0 left-1/2 h-full w-px text-(--stroke-soft-200)"
				style={{
					background:
						"linear-gradient(180deg, currentColor 4px, transparent 4px) 50% 50% / 1px 10px no-repeat repeat",
				}}
			/>
		</div>
	);
}
