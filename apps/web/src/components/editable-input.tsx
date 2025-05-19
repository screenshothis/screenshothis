"use client";

import Edit03SolidIcon from "virtual:icons/hugeicons/edit-03-solid";

import { composeRefs } from "radix-ui/internal";
import * as React from "react";

import { cn } from "#/utils/cn.ts";

export type EditableInputProps = React.ComponentPropsWithRef<"input"> & {
	prefix?: string;
};

export function EditableInput({
	className,
	value: initialValue = "",
	onChange,
	prefix,
	...rest
}: EditableInputProps) {
	const [editing, setEditing] = React.useState(false);
	const [value, setValue] = React.useState(initialValue);
	const [tempValue, setTempValue] = React.useState(value);

	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		setValue(initialValue);
		setTempValue(initialValue);
	}, [initialValue]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTempValue(e.target.value);
		onChange?.(e);
	};

	const handleCancel = () => {
		setTempValue(value);
		setEditing(false);
	};

	const handleSave = () => {
		setValue(tempValue);
		setEditing(false);
		const syntheticEvent = {
			target: { value: tempValue },
		} as React.ChangeEvent<HTMLInputElement>;
		onChange?.(syntheticEvent);
	};

	const handleStartEditing = () => {
		setEditing(true);
		setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.focus();
				// Set cursor position to the end
				const length = inputRef.current.value.length;
				inputRef.current.setSelectionRange(length, length);
			}
		}, 0);
	};

	return (
		<div
			className={cn(
				"group relative flex h-10 w-full items-center gap-2.5 rounded-10 bg-(--bg-white-0) px-3",
				"transition duration-200 ease-out",
				"hover:[&:not(&:has(input:focus))]:bg-(--bg-weak-50) hover:[&:not(&:has(input:focus))]:text-(--text-strong-950)",
				"has-[input:focus]:ring-1 has-[input:focus]:ring-primary has-[input:focus]:ring-inset",
				{
					"cursor-pointer": !editing,
				},
			)}
			onClick={(e) => {
				if (editing) return e.preventDefault();
				handleStartEditing();
			}}
			// biome-ignore lint/a11y/useSemanticElements: we want to use a button for the click handler
			role="button"
			tabIndex={editing ? -1 : 0}
			onKeyDown={(e) => {
				if (editing) return;
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleStartEditing();
				}
			}}
		>
			<div className="flex w-full items-baseline">
				{prefix && (
					<span className="select-none text-(--text-strong-950) text-paragraph-sm">
						{prefix}
					</span>
				)}
				<input
					type="text"
					ref={composeRefs(inputRef, rest.ref)}
					value={tempValue}
					onChange={handleInputChange}
					readOnly={!editing}
					className={cn(
						"h-10 w-full flex-1 bg-none bg-transparent caret-primary",
						"text-(--text-strong-950) text-paragraph-sm",
						"transition duration-200 ease-out",
						"placeholder:text-(--text-soft-400)",
						"focus:outline-none",
						"read-only:pointer-events-none",
						className,
					)}
					{...rest}
				/>
			</div>
			{!editing && (
				<div className="shrink-0">
					<Edit03SolidIcon className="size-5 text-(--text-soft-400)" />
				</div>
			)}
			{editing && (
				<div className="flex shrink-0 items-center gap-2.5">
					<button
						type="button"
						className="text-(--text-sub-600) text-label-sm"
						onClick={handleCancel}
					>
						Cancel
					</button>
					<button
						type="button"
						className="text-label-sm text-primary"
						onClick={handleSave}
					>
						Save
					</button>
				</div>
			)}
		</div>
	);
}
EditableInput.displayName = "EditableInput";
