"use client";

import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import * as Checkbox from "../ui/checkbox.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type CheckboxFieldProps = Omit<FieldProps, "children"> &
	Checkbox.CheckboxProps & {
		wrapperClassName?: string;
	};

export function CheckboxField({
	wrapperClassName,
	label,
	labelClassName,
	hint,
	hintClassName,
	id: idProp,
	...rest
}: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();
	const errors = useStore(field.store, (state) => state.meta.errors);
	const generatedId = React.useId();
	const id = idProp || generatedId;

	const error = errors.map((error) => error.message).join(" ");

	return (
		<Field
			label={label}
			labelClassName={labelClassName}
			error={error}
			hint={hint}
			hintClassName={hintClassName}
			id={`${id}-form-item`}
			className={wrapperClassName}
		>
			<Checkbox.Root
				data-slot="form-control"
				aria-describedby={[
					errors && `${id}-form-item-message`,
					`${id}-form-item-description`,
				]
					.filter(Boolean)
					.join(" ")}
				aria-invalid={error ? true : undefined}
				id={`${id}-form-item`}
				checked={field.state.value}
				onCheckedChange={(checked) => field.handleChange(!!checked)}
				onBlur={field.handleBlur}
				{...rest}
			/>
		</Field>
	);
}
CheckboxField.displayName = "CheckboxField";
