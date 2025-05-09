import Loading03Icon from "virtual:icons/hugeicons/loading-03";

import { useFormContext } from "#/hooks/form-context.ts";
import { cn } from "#/utils/cn.ts";
import { Button, type ButtonProps } from "../ui/button.tsx";

type SubmitButtonProps = ButtonProps & {
	isSubmitting?: boolean;
};

export function SubmitButton({
	children,
	type = "submit",
	isSubmitting = false,
	...props
}: SubmitButtonProps) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button
					disabled={props.disabled || isSubmitting}
					type={type}
					{...props}
					trailingIconClassName={cn(
						isSubmitting && "invisible",
						props.trailingIconClassName,
					)}
					leadingIconClassName={cn(
						isSubmitting && "invisible",
						props.leadingIconClassName,
					)}
				>
					<span className={cn(isSubmitting && "invisible")}>{children}</span>

					{isSubmitting ? (
						<div className="-translate-1/2 absolute top-1/2 left-1/2">
							<Loading03Icon className="size-5 animate-spin" />
						</div>
					) : null}
				</Button>
			)}
		</form.Subscribe>
	);
}
