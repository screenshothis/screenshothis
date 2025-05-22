import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import * as Switch from "../ui/switch.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type SwitchFieldProps = Omit<FieldProps, "children"> &
	Switch.SwitchProps & {
		wrapperClassName?: string;
	};

export function SwitchField({
	wrapperClassName,
	label,
	labelClassName,
	hint,
	hintClassName,
	id: idProp,
	...rest
}: SwitchFieldProps) {
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
			<Switch.Root
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
				onCheckedChange={(checked) => field.handleChange(checked)}
				onBlur={field.handleBlur}
				{...rest}
			/>
		</Field>
	);
}
SwitchField.displayName = "SwitchField";
