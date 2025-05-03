"use client";

import { cn } from "#/utils/cn.ts";

export function PageHeader({
	children,
	className,
	icon,
	title,
	description,
	contentClassName,
	...rest
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
	icon?: React.ReactNode;
	title?: string | null;
	description?: string;
	contentClassName?: string;
}) {
	return (
		<header
			className={cn(
				"flex min-h-[88px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8",
				className,
			)}
			{...rest}
		>
			<div className="flex flex-1 gap-4 lg:gap-3.5">
				{icon}
				<div className="space-y-1">
					<div className="text-label-md lg:text-label-lg">{title}</div>
					<div className="text-(--text-sub-600) text-paragraph-sm">
						{description}
					</div>
				</div>
			</div>
			<div className={cn("flex items-center gap-3", contentClassName)}>
				{/* <SearchMenuButton className='hidden lg:flex' />
        <NotificationButton className='hidden lg:flex' /> */}

				{children}
			</div>
		</header>
	);
}
