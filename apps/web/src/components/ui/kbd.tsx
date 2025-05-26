import { cn } from "#/utils/cn.ts";

function Kbd({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex h-5 items-center gap-0.5 whitespace-nowrap rounded-4 bg-(--bg-white-0) px-1.5 text-(--text-soft-400) text-subheading-xs ring-(--stroke-soft-200) ring-1 ring-inset",
				className,
			)}
			{...rest}
		/>
	);
}

export { Kbd as Root };
