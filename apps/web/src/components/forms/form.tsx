import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "#/hooks/form-context.ts";
import { CheckboxField } from "./checkbox.tsx";
import { EditableInputField } from "./editable-input-field.tsx";
import { FancySubmitButton } from "./fancy-submit-button.tsx";
import { PasswordField } from "./password-field.tsx";
import { SelectField } from "./select-field.tsx";
import { SubmitButton } from "./submit-button.tsx";
import { SwitchField } from "./switch-field.tsx";
import { TextField } from "./text-field.tsx";
import { Textarea } from "./textarea.tsx";

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		CheckboxField,
		EditableInputField,
		PasswordField,
		SelectField,
		SwitchField,
		TextField,
		Textarea,
	},
	formComponents: {
		SubmitButton,
		FancySubmitButton,
	},
});
