"use client";

import Search01Icon from "virtual:icons/hugeicons/search-01";

import { ApiKeysFilterSchema } from "@screenshothis/schemas/api-keys";
import { useNavigate, useSearch } from "@tanstack/react-router";
import * as React from "react";
import type { z } from "zod";

import { useAppForm } from "../forms/form.tsx";

export function ApiKeysFilter() {
	const navigate = useNavigate();
	const searchParams = useSearch({
		from: "/_app/keys",
	});
	const form = useAppForm({
		validators: {
			onChange: ApiKeysFilterSchema,
		},
		defaultValues: {
			q: searchParams.q || "",
		} as z.input<typeof ApiKeysFilterSchema>,
		onSubmit({ value }) {
			navigate({
				to: ".",
				search: {
					q: value.q || undefined,
				},
			});
		},
		listeners: {
			onChange({ fieldApi }) {
				if (fieldApi.name === "q") {
					navigate({
						to: ".",
						...(fieldApi.state.value && {
							search: { q: fieldApi.state.value },
						}),
					});
				}
			},
			onChangeDebounceMs: 500,
		},
	});

	const handleSubmit = React.useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			void form.handleSubmit();
		},
		[form],
	);

	return (
		<form.AppForm>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col justify-between gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3"
			>
				<form.AppField
					name="q"
					children={(field) => (
						<field.TextField
							leadingIcon={Search01Icon}
							wrapperClassName="flex-1"
							label="Search"
							labelClassName="sr-only"
							name="q"
							id="q"
							type="search"
							inputMode="search"
							placeholder="Search your API keys..."
						/>
					)}
				/>
			</form>
		</form.AppForm>
	);
}
