import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "#/hooks/form-context.ts";
import { CheckboxField } from "./checkbox.tsx";
import { SubmitButton } from "./submit-button.tsx";
import { SwitchField } from "./switch-field.tsx";
import { TextField } from "./text-field.tsx";
import { Textarea } from "./textarea.tsx";

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		CheckboxField,
		TextField,
		SwitchField,
		Textarea,
	},
	formComponents: {
		SubmitButton,
	},
});
