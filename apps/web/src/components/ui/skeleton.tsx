import { cn } from "#/utils/cn.ts";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-(--bg-weak-50)", className)}
			{...props}
		/>
	);
}

export { Skeleton };
