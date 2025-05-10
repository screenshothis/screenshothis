"use client";

import { useStore } from "@tanstack/react-form";
import * as React from "react";

import { useFieldContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import * as SelectPrimitives from "../ui/select.tsx";
import { Field, type FieldProps } from "./field.tsx";

export type SelectFieldProps = Omit<FieldProps, "children"> &
	SelectPrimitives.RootProps & {
		wrapperClassName?: string;
		position?: "item-aligned" | "popper";
		triggerIcon?: React.ForwardRefExoticComponent<
			React.SVGProps<SVGSVGElement>
		>;
		triggerClassName?: string;
		placeholder?: React.ReactNode;
		options: Array<{
			value: string;
			label: React.ReactNode;
			icon?:
				| React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>
				| React.ComponentType<React.SVGProps<SVGSVGElement>>;
			disabled?: boolean;
		}>;
	};

export function SelectField({
	wrapperClassName,
	$size,
	$variant,
	label,
	labelClassName,
	position,
	triggerIcon,
	triggerClassName,
	placeholder,
	options,
	hint,
	hintClassName,
	...rest
}: SelectFieldProps) {
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
			id={`${id}-form-item-trigger`}
			className={cn("flex flex-col gap-1", wrapperClassName)}
		>
			<SelectPrimitives.Root
				onValueChange={field.handleChange}
				value={field.state.value}
				$error={!!error}
				$size={$size}
				$variant={$variant}
				{...rest}
			>
				<SelectPrimitives.Trigger
					aria-describedby={[
						errors && `${id}-form-item-message`,
						`${id}-form-item-description`,
					]
						.filter(Boolean)
						.join(" ")}
					aria-invalid={error ? true : undefined}
					onBlur={field.handleBlur}
					className={triggerClassName}
					id={`${id}-form-item-trigger`}
				>
					{triggerIcon ? (
						<SelectPrimitives.TriggerIcon as={triggerIcon} />
					) : null}
					<SelectPrimitives.Value placeholder={placeholder} />
				</SelectPrimitives.Trigger>
				<SelectPrimitives.Content position={position}>
					{options.map((item) => (
						<SelectPrimitives.Item
							disabled={item.disabled}
							key={item.value}
							value={item.value}
						>
							{item.icon ? <SelectPrimitives.ItemIcon as={item.icon} /> : null}
							{item.label}
						</SelectPrimitives.Item>
					))}
				</SelectPrimitives.Content>
			</SelectPrimitives.Root>
		</Field>
	);
}
SelectField.displayName = "SelectField";
