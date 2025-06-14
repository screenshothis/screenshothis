"use client";

import InformationCircleSolidIcon from "virtual:icons/hugeicons/information-circle-solid";

import * as m from "motion/react-m";
import * as React from "react";

import { cn } from "#/utils/cn.ts";
import * as Hint from "../ui/hint.tsx";
import * as Label from "../ui/label.tsx";

export type FieldProps = {
	label?: React.ReactNode;
	labelSub?: React.ReactNode;
	labelClassName?: string;
	id?: string;
	className?: string;
	disabled?: boolean;
	children?: React.ReactNode;
	childrenWrapperClassName?: string;
	hint?: string | Array<string>;
	hintClassName?: string;
	hintIcon?: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
	hintIconClassName?: string;
	error?: string | Array<string>;
};

const HintRootMotion = m.create(Hint.Root);

export function Field({
	error,
	label,
	labelSub,
	labelClassName,
	className,
	children,
	childrenWrapperClassName,
	hint,
	hintClassName,
	hintIcon = InformationCircleSolidIcon,
	hintIconClassName,
	...props
}: FieldProps) {
	const generatedId = React.useId();
	const id = props.id || generatedId;

	return (
		<div data-slot="form-item" className={cn("grid gap-1", className)}>
			<div className={cn("grid gap-1", childrenWrapperClassName)}>
				{label ? (
					<Label.Root
						className={labelClassName}
						disabled={props.disabled}
						htmlFor={id}
						data-slot="form-label"
					>
						{label}
						{labelSub ? (
							<Label.Sub className="ml-1">{labelSub}</Label.Sub>
						) : null}
					</Label.Root>
				) : null}

				{children}
			</div>

			{error || hint ? (
				<HintRootMotion
					data-slot={error ? "form-message" : "form-description"}
					$disabled={props.disabled}
					$error={!!error}
					id={[
						!!error && `${id}-form-item-message`,
						`${id}-form-item-description`,
					]
						.filter(Boolean)
						.join(" ")}
					className={hintClassName}
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
				>
					<Hint.Icon as={hintIcon} className={hintIconClassName} />
					<span className="mt-px">{error || hint}</span>
				</HintRootMotion>
			) : null}
		</div>
	);
}
