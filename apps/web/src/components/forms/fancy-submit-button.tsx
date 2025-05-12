"use client";

import Loading03Icon from "virtual:icons/hugeicons/loading-03";

import { useFormContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import * as FancyButton from "../ui/fancy-button.tsx";

type SubmitButtonProps = FancyButton.FancyButtonProps & {
	isSubmitting?: boolean;
};

export function FancySubmitButton({
	children,
	type = "submit",
	isSubmitting = false,
	...props
}: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<FancyButton.Root
					disabled={props.disabled || isSubmitting}
					type={type}
					{...props}
				>
					<span className={cn(isSubmitting && "invisible")}>{children}</span>

					{isSubmitting ? (
						<div className="-translate-1/2 absolute top-1/2 left-1/2">
							<Loading03Icon className="size-5 animate-spin" />
						</div>
					) : null}
				</FancyButton.Root>
			)}
		</form.Subscribe>
	);
}
