"use client";

import ArrowDown01Icon from "virtual:icons/hugeicons/arrow-down-01";

import { RangeSchema } from "@screenshothis/schemas/dashboard";
import { useNavigate } from "@tanstack/react-router";
import { Select as SelectPrimitives } from "radix-ui";
import type { z } from "zod";

import * as Badge from "#/components/ui/badge.tsx";
import * as Button from "#/components/ui/button-primitives.tsx";
import * as Select from "#/components/ui/select.tsx";
import { TotalScreenshotsChart } from "./charts/total-screenshots-chart.tsx";

type TotalScreenshotsProps = {
	range: z.infer<typeof RangeSchema>;
	data: { date: string; value: number; prev: string }[];
};

export function TotalScreenshots({ range, data }: TotalScreenshotsProps) {
	const navigate = useNavigate();

	const handleValueChange = (value: string) => {
		navigate({
			to: "/dashboard",
			search: { range: value as z.infer<typeof RangeSchema> },
		});
	};

	return (
		<div>
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center xl:flex-row xl:items-center min-[1100px]:flex-col min-[1100px]:items-start">
				<div>
					<div className="text-(--text-sub-600) text-label-md">
						Total Screenshots
					</div>
					<div className="mt-1 flex items-center gap-2">
						<div className="text-(--text-strong-950) text-h5">
							{data.reduce((acc, curr) => acc + curr.value, 0)}
						</div>
						<Badge.Root $style="lighter" $color="green" $size="md">
							{data.length > 0 ? data[data.length - 1].prev : "0%"}
						</Badge.Root>
						<div className="text-(--text-sub-600) text-label-xs">
							vs last {range}
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<Select.Root value={range} onValueChange={handleValueChange}>
						<SelectPrimitives.Trigger asChild>
							<Button.Root
								$type="neutral"
								$style="stroke"
								$size="xs"
								className="gap-2 px-2.5"
							>
								<Select.Value />
								<Button.Icon as={ArrowDown01Icon} />
							</Button.Root>
						</SelectPrimitives.Trigger>
						<Select.Content>
							{RangeSchema.options.map((option) => (
								<Select.Item key={option} value={option}>
									{option}
								</Select.Item>
							))}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div className="mt-4">
				<TotalScreenshotsChart range={range} data={data} />
			</div>
		</div>
	);
}
