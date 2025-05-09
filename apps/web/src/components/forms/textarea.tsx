import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import * as TextareaPrimitive from "../ui/textarea.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type TextFieldProps = Omit<FieldProps, "children"> &
	TextareaPrimitive.TextareaRootProps &
	TextareaPrimitive.TextareaProps & {
		wrapperClassName?: string;
	};

export function Textarea({
	wrapperClassName,
	$simple = false,
	label,
	labelClassName,
	hint,
	hintClassName,
	...rest
}: TextFieldProps) {
	const field = useFieldContext<string>();
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
			id={`${id}-form-item`}
			className={cn("flex flex-col gap-1", wrapperClassName)}
		>
			<TextareaPrimitive.Root
				data-slot="form-control"
				$error={!!error}
				aria-describedby={[
					errors && `${id}-form-item-message`,
					`${id}-form-item-description`,
				]
					.filter(Boolean)
					.join(" ")}
				aria-invalid={error ? true : undefined}
				id={`${id}-form-item`}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
				{...rest}
			/>
		</Field>
	);
}
Textarea.displayName = "Textarea";
