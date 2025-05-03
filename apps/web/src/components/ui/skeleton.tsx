import { cn } from "#/utils/cn.ts";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-6 bg-(--bg-weak-50)", className)}
			{...props}
		/>
	);
}

export { Skeleton };
