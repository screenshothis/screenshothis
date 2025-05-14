import MoreVerticalIcon from "virtual:icons/hugeicons/more-vertical";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import * as React from "react";

import { cn } from "#/utils/cn.ts";
import { Button } from "../ui/button.tsx";
import * as Table from "../ui/table.tsx";

type KeyDataType = {
	id: string;
	name: string | null;
	lastRequest: Date | null;
	createdAt: Date;
};

type KeysTableProps = {
	data: Array<KeyDataType>;
	total: number;
};

const columns: ColumnDef<KeyDataType>[] = [
	{
		header: "ID",
		accessorKey: "id",
		accessorFn: (row) => row.id,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.id}
				</div>
			);
		},
	},
	{
		header: "Name",
		accessorKey: "name",
		accessorFn: (row) => row.name,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.name}
				</div>
			);
		},
	},
	{
		header: "Last Accessed",
		accessorKey: "lastRequest",
		accessorFn: (row) => row.lastRequest,
		cell({ row }) {
			return (
				<div className="text-(--text-sub-600) text-paragraph-sm">
					{row.original.lastRequest
						? formatDistanceToNow(row.original.lastRequest)
						: "N/A"}
				</div>
			);
		},
	},
	{
		header: "Created at",
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
				<Button
					$size="xs"
					$style="ghost"
					$type="neutral"
					leadingIcon={MoreVerticalIcon}
					leadingIconClassName="size-6"
				>
					<span className="sr-only">Actions</span>
				</Button>
			);
		},
		size: 76,
		meta: {
			className: "px-4",
		},
	},
];

export function KeysTable({ data, total }: KeysTableProps) {
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
									id={header.id}
									colSpan={header.colSpan}
									style={{
										width: header.column.getSize(),
									}}
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
										style={{
											width: cell.column.getSize(),
										}}
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
