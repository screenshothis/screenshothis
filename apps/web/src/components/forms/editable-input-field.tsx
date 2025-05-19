"use client";

import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import { EditableInput, type EditableInputProps } from "../editable-input.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type EditableInputFieldProps = Omit<FieldProps, "children"> &
	EditableInputProps & {
		wrapperClassName?: string;
	};

export function EditableInputField({
	wrapperClassName,
	label,
	labelClassName,
	hint,
	hintClassName,
	...rest
}: EditableInputFieldProps) {
	const field = useFieldContext<string | number>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	const generatedId = React.useId();
	const id = rest.id || generatedId;

	const error = errors.map((error) => error.message).join(" ");

	return (
		<Field
			label={label}
			labelClassName={labelClassName}
			error={error}
			hint={hint}
			hintClassName={hintClassName}
			id={id}
			className={cn("grid gap-1", wrapperClassName)}
		>
			<EditableInput
				aria-describedby={[
					errors && `${id}-form-item-message`,
					`${id}-form-item-description`,
				]
					.filter(Boolean)
					.join(" ")}
				aria-invalid={error ? true : undefined}
				onBlur={field.handleBlur}
				onChange={(e) => {
					if (rest.type === "number") {
						field.handleChange(e.target.valueAsNumber as string | number);
					} else {
						field.handleChange(e.target.value as string | number);
					}
				}}
				type="text"
				value={field.state.value}
				{...rest}
			/>
		</Field>
	);
}
EditableInputField.displayName = "EditableInputField";
