import MoreVerticalIcon from "virtual:icons/hugeicons/more-vertical";

import type { ScreenshotSchema } from "@screenshothis/schemas/screenshots";
import { Link } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import * as React from "react";
import type { ObjectToCamel } from "ts-case-convert";
import type { z } from "zod";

import { cn } from "#/utils/cn.ts";
import * as Button from "../ui/button-primitives.tsx";
import * as Table from "../ui/table.tsx";

type ScreenshotDataType = ObjectToCamel<z.infer<typeof ScreenshotSchema>>;

type ScreenshotsTableProps = {
	data: Array<ScreenshotDataType>;
	total: number;
};

const columns: ColumnDef<ScreenshotDataType>[] = [
	{
		header: "Host",
		accessorKey: "url",
		accessorFn: (row) => row.url,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.url ? new URL(row.original.url).host : "N/A"}
				</div>
			);
		},
		meta: {
			className: "w-auto",
		},
	},
	{
		header: "Path",
		accessorKey: "url",
		accessorFn: (row) => row.url,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.url ? new URL(row.original.url).pathname : "N/A"}
				</div>
			);
		},
	},
	{
		header: "Generated at",
		accessorKey: "createdAt",
		accessorFn: (row) => row.createdAt,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.createdAt
						? format(row.original.createdAt, "MMM d, yyyy")
						: "N/A"}
				</div>
			);
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell() {
			return (
				<Button.Root $size="xs" $style="ghost" $type="neutral" asChild>
					<Link to="/screenshots">
						<Button.Icon as={MoreVerticalIcon} className="size-6" />
					</Link>
				</Button.Root>
			);
		},
		meta: {
			className: "px-5 w-18",
		},
	},
];

export function ScreenshotsTable({ data, total }: ScreenshotsTableProps) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		rowCount: total,
	});

	return (
		<Table.Root className="-mx-4 w-auto px-4 lg:mx-0 lg:w-full lg:px-0">
			<Table.Header>
				{table.getHeaderGroups().map((headerGroup) => (
					<Table.Row key={headerGroup.id}>
						{headerGroup.headers.map((header) => {
							return (
								<Table.Head
									key={header.id}
									className={
										(header.column.columnDef.meta as { className?: string })
											?.className
									}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</Table.Head>
							);
						})}
					</Table.Row>
				))}
			</Table.Header>

			<Table.Body>
				{table.getRowModel().rows?.length > 0 &&
					table.getRowModel().rows.map((row, i, arr) => (
						<React.Fragment key={row.id}>
							<Table.Row data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<Table.Cell
										key={cell.id}
										className={cn(
											"h-12",
											(cell.column.columnDef.meta as { className?: string })
												?.className,
										)}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</Table.Cell>
								))}
							</Table.Row>
							{i < arr.length - 1 && <Table.RowDivider />}
						</React.Fragment>
					))}
			</Table.Body>
		</Table.Root>
	);
}
