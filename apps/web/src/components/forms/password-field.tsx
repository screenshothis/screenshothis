"use client";

import ViewIcon from "virtual:icons/hugeicons/view";
import ViewOffSlashIcon from "virtual:icons/hugeicons/view-off-slash";

import * as React from "react";

import { TextField, type TextFieldProps } from "./text-field.tsx";

export function PasswordField(props: TextFieldProps) {
	const [showPassword, setShowPassword] = React.useState(false);

	return (
		<TextField
			{...props}
			type={showPassword ? "text" : "password"}
			placeholder="••••••••••"
			inlineTrailingNode={
				<button type="button" onClick={() => setShowPassword((s) => !s)}>
					{showPassword ? (
						<ViewOffSlashIcon className="size-5 text-(--text-soft-400) group-has-[disabled]:text-(-text-disabled-300)" />
					) : (
						<ViewIcon className="size-5 text-(--text-soft-400) group-has-[disabled]:text-(-text-disabled-300)" />
					)}
				</button>
			}
		/>
	);
}
PasswordField.displayName = "PasswordField";
