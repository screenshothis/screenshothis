"use client";

import { Dialog as DialogPrimitives } from "radix-ui";

import { useSettingsStore } from "#/store/settings.ts";
import { cn } from "#/utils/cn.ts";
import { SettingsContent } from "./settings-content.tsx";

export function SettingsModal() {
	const { isOpen, setOpen } = useSettingsStore();

	return (
		<DialogPrimitives.Root open={isOpen} onOpenChange={setOpen}>
			<DialogPrimitives.Portal>
				<DialogPrimitives.Overlay
					className={cn(
						// base
						"fixed inset-0 z-50 overflow-hidden bg-overlay",
						"grid size-full flex-col items-center overflow-y-auto p-4 sm:p-6",
						// animation
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=open]:animate-in",
					)}
				>
					<DialogPrimitives.Content
						className={cn(
							// base
							"relative mx-auto flex h-max min-h-[680px] w-full min-w-0 max-w-[980px] rounded-24 bg-(--bg-white-0) shadow-md",
							// animation
							"data-[state=open]:animate-in data-[state=open]:duration-200 data-[state=open]:ease-out",
							"data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in",
							"data-[state=open]:slide-in-from-top-6",
							"data-[state=closed]:slide-out-to-top-6",
						)}
					>
						<SettingsContent />
					</DialogPrimitives.Content>
				</DialogPrimitives.Overlay>
			</DialogPrimitives.Portal>
		</DialogPrimitives.Root>
	);
}
