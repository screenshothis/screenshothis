import UnfoldMoreIcon from "virtual:icons/hugeicons/unfold-more";

import { cn } from "#/utils/cn.ts";
import * as Avatar from "./ui/avatar.tsx";
import * as DropdownMenu from "./ui/dropdown-menu.tsx";

export function WorkspaceItem() {
	return (
		<button
			className="group/item flex w-full cursor-pointer items-center gap-3 rounded-10 p-2 text-left outline-none transition-default hover:bg-(--bg-weak-50) focus:outline-none"
			type="button"
		>
			<div className="flex size-10 items-center justify-center rounded-full shadow-xs ring-(--stroke-soft-200) ring-1 ring-inset">
				<Avatar.Root $size="24" placeholderType="workspace">
					{/* TODO: Add workspace avatar */}

					{/* {workspace.name
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()} */}
				</Avatar.Root>
			</div>
			<div className="flex-1 space-y-1">
				<div className="text-label-sm">
					{/* TODO: Add workspace name */}
					Placeholder
				</div>
			</div>
			{/* {workspace.id === currentWorkspace.id ? <Tick01Icon className="size-5 text-(--text-sub-600)" /> : null} */}
		</button>
	);
}

export function WorkspaceSwitch({ className }: { className?: string }) {
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				className={cn(
					"flex w-full items-center gap-3 whitespace-nowrap p-3 text-left outline-none focus:outline-none",
					className,
				)}
			>
				<Avatar.Root $size="40" placeholderType="workspace">
					{/* TODO: Add workspace avatar */}

					{/* {currentWorkspace.name
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()} */}
				</Avatar.Root>
				<div
					className="flex w-[172px] shrink-0 items-center gap-3"
					data-hide-collapsed
				>
					<div className="flex-1 space-y-1">
						<div className="truncate text-label-sm">
							{/* TODO: add current workspace name */}
							Placeholder
						</div>
					</div>
					<div className="flex size-6 items-center justify-center rounded-6 border border-(--stroke-soft-200) bg-(--bg-white-0) shadow-xs">
						<UnfoldMoreIcon className="size-4 text-(--text-sub-600)" />
					</div>
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" side="right" sideOffset={24}>
				{/* {workspaces?.length && workspaces.length > 1 ? (
                    <>
                        <Divider.Root $type="line-spacing" />

                        {workspaces.map((workspace) => (
                            <WorkspaceItem key={workspace.id} workspace={workspace} />
                        ))}

                        <Divider.Root $type="line-spacing" />
                    </>
                ) : null} */}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
