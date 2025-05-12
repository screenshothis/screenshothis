import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import { Input, type InputProps } from "../ui/input.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type TextFieldProps = Omit<FieldProps, "children"> &
	InputProps & {
		wrapperClassName?: string;
	};

export function TextField({
	wrapperClassName,
	$size,
	label,
	labelClassName,
	leadingIcon: LeadingIcon,
	trailingIcon: TrailingIcon,
	leadingNode,
	trailingNode,
	inlineLeadingNode,
	inlineTrailingNode,
	hint,
	hintClassName,
	...rest
}: TextFieldProps) {
	const field = useFieldContext<string | number>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	const generatedId = React.useId();
	const id = rest.id || generatedId;

	const error = errors?.[0]?.message;

	return (
		<Field
			label={label}
			labelClassName={labelClassName}
			error={error}
			hint={hint}
			hintClassName={hintClassName}
			id={id}
			className={cn("flex flex-col gap-1", wrapperClassName)}
		>
			<Input
				data-slot="form-control"
				$error={!!error}
				leadingIcon={LeadingIcon}
				trailingIcon={TrailingIcon}
				leadingNode={leadingNode}
				trailingNode={trailingNode}
				inlineLeadingNode={inlineLeadingNode}
				inlineTrailingNode={inlineTrailingNode}
				aria-describedby={[
					errors && `${id}-form-item-message`,
					`${id}-form-item-description`,
				]
					.filter(Boolean)
					.join(" ")}
				aria-invalid={error ? true : undefined}
				id={`${id}-form-item`}
				type="text"
				value={field.state.value}
				onChange={(e) => {
					if (rest.type === "number") {
						field.handleChange(e.target.valueAsNumber as string | number);
					} else {
						field.handleChange(e.target.value as string | number);
					}
				}}
				onBlur={field.handleBlur}
				{...rest}
			/>
		</Field>
	);
}
TextField.displayName = "TextField";
