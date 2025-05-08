import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "#/hooks/form-context.ts";
import { SubmitButton } from "./submit-button.tsx";
import { TextField } from "./text-field.tsx";

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
	},
	formComponents: {
		SubmitButton,
	},
});
