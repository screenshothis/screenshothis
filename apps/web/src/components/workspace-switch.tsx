import { useQuery } from "@tanstack/react-query";
import Tick01Icon from "virtual:icons/hugeicons/tick-01";
import UnfoldMoreIcon from "virtual:icons/hugeicons/unfold-more";

import { cn } from "#/utils/cn.ts";
import { useORPC } from "#/utils/orpc.ts";
import * as Avatar from "./ui/avatar.tsx";
import * as DropdownMenu from "./ui/dropdown-menu.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

type WorkspaceItem = {
	workspace: {
		id: string;
		name: string;
	};
	isCurrent: boolean;
};

export function WorkspaceItem({ workspace, isCurrent }: WorkspaceItem) {
	return (
		<button
			className="group/item flex w-full cursor-pointer items-center gap-3 rounded-10 p-2 text-left outline-none transition-default hover:bg-(--bg-weak-50) focus:outline-none"
			type="button"
		>
			<div className="flex size-10 items-center justify-center rounded-full shadow-xs ring-(--stroke-soft-200) ring-1 ring-inset">
				<Avatar.Root $size="40" placeholderType="workspace">
					{/* TODO: Add workspace avatar */}

					{workspace.name
						.split(" ")
						.slice(0, 2)
						.map((word: string) => word[0])
						.join("")
						.toUpperCase()}
				</Avatar.Root>
			</div>
			<div className="flex-1 space-y-1">
				<div className="text-label-sm">{workspace.name}</div>
			</div>

			{isCurrent ? (
				<Tick01Icon className="size-5 text-(--text-sub-600)" />
			) : null}
		</button>
	);
}

export function WorkspaceSwitch({ className }: { className?: string }) {
	const orpc = useORPC();
	const { data } = useQuery(orpc.me.queryOptions());

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				className={cn(
					"flex w-full items-center gap-3 whitespace-nowrap p-3 text-left outline-none focus:outline-none",
					className,
				)}
			>
				{data?.currentWorkspace ? (
					<Avatar.Root $size="40" placeholderType="workspace">
						{/* TODO: Add workspace avatar */}

						{data?.currentWorkspace.name
							.split(" ")
							.slice(0, 2)
							.map((word: string) => word[0])
							.join("")
							.toUpperCase()}
					</Avatar.Root>
				) : (
					<Skeleton className="size-10 rounded-full" />
				)}

				<div
					className="flex w-[172px] shrink-0 items-center gap-3"
					data-hide-collapsed
				>
					<div className="flex-1 space-y-1">
						<div className="truncate text-label-sm">
							{data?.currentWorkspace.name ?? <Skeleton className="h-5" />}
						</div>
					</div>
					<div className="flex size-6 items-center justify-center rounded-6 border border-(--stroke-soft-200) bg-(--bg-white-0) shadow-xs">
						<UnfoldMoreIcon className="size-4 text-(--text-sub-600)" />
					</div>
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" side="right" sideOffset={24}>
				{data?.workspaces?.length ? (
					<>
						{/* <Divider.Root $type="line-spacing" /> */}

						{data.workspaces.map((workspace) => (
							<WorkspaceItem
								key={workspace.id}
								workspace={workspace}
								isCurrent={workspace.id === data.currentWorkspace.id}
							/>
						))}

						{/* <Divider.Root $type="line-spacing" /> */}
					</>
				) : null}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
