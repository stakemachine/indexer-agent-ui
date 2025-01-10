"use client";

import React, { useEffect, useRef } from "react";
import { GeistMono } from "geist/font/mono";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getPaginationRowModel,
	getFilteredRowModel,
	getSortedRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RefreshCw, Filter } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DataGridProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onRefresh?: () => void;
	autoRefreshInterval?: number;
	error?: string | null;
	isLoading?: boolean;
	isValidating?: boolean;
	initialState?: {
		sorting?: SortingState;
		columnFilters?: ColumnFiltersState;
		pagination?: {
			pageIndex: number;
			pageSize: number;
		};
	};
	autoRefreshEnabled?: boolean;
	onAutoRefreshChange?: (enabled: boolean) => void;
}

function ColumnFilter({ column }: { column: any }) {
	const columnFilterValue = column.getFilterValue();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Filter {column.id}</span>
					<ChevronDown className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="end">
				<Input
					type="text"
					value={(columnFilterValue ?? "") as string}
					onChange={(event) => column.setFilterValue(event.target.value)}
					placeholder={`Search ${column.id}...`}
					className="max-w-sm"
				/>
			</PopoverContent>
		</Popover>
	);
}

export function DataGrid<TData, TValue>({
	columns,
	data,
	onRefresh,
	autoRefreshInterval = 30000,
	error,
	isLoading,
	isValidating,
	initialState,
	autoRefreshEnabled,
	onAutoRefreshChange,
}: DataGridProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>(
		initialState?.sorting || [],
	);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		initialState?.columnFilters || [],
	);
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [rowSelection, setRowSelection] = React.useState({});
	const [internalAutoRefresh, setInternalAutoRefresh] = React.useState(false);
	const autoRefresh =
		autoRefreshEnabled !== undefined ? autoRefreshEnabled : internalAutoRefresh;
	const setAutoRefresh = (value: boolean) => {
		if (onAutoRefreshChange) {
			onAutoRefreshChange(value);
		} else {
			setInternalAutoRefresh(value);
		}
	};

	const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			rowSelection,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: (row, columnId, filterValue) => {
			const searchableValues = Object.entries(row.original).flatMap(
				([key, value]) => {
					if (typeof value === "object" && value !== null) {
						return Object.values(value);
					}
					return value;
				},
			);

			return searchableValues.some(
				(v) =>
					typeof v === "string" &&
					v.toLowerCase().includes(filterValue.toLowerCase()),
			);
		},
		initialState: {
			pagination: initialState?.pagination,
		},
	});

	useEffect(() => {
		if (autoRefresh && onRefresh) {
			autoRefreshTimerRef.current = setInterval(() => {
				onRefresh();
			}, autoRefreshInterval);
		}

		return () => {
			if (autoRefreshTimerRef.current) {
				clearInterval(autoRefreshTimerRef.current);
			}
		};
	}, [autoRefresh, onRefresh, autoRefreshInterval]);

	const isFiltered =
		table.getState().columnFilters.length > 0 ||
		table.getState().globalFilter !== "";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Input
						placeholder="Search all columns..."
						value={globalFilter ?? ""}
						onChange={(e) => {
							const value = e.target.value;
							setGlobalFilter(value);
						}}
						className="max-w-sm"
					/>
					{isFiltered && (
						<Badge
							variant="secondary"
							className="h-8 px-3 flex items-center space-x-1"
						>
							<Filter className="h-4 w-4" />
							<span>Filtered</span>
						</Badge>
					)}
				</div>
				<div className="flex items-center space-x-2">
					{onRefresh && (
						<>
							<Button
								variant="outline"
								onClick={onRefresh}
								disabled={isLoading || isValidating}
							>
								<RefreshCw
									className={`h-4 w-4 mr-2 ${isLoading || isValidating ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
							<div className="flex items-center space-x-2">
								<Switch
									id="auto-refresh"
									checked={autoRefresh}
									onCheckedChange={setAutoRefresh}
								/>
								<Label htmlFor="auto-refresh">Auto-refresh</Label>
							</div>
						</>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="ml-auto">
								Columns
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : (
											<div className="flex items-center space-x-2">
												<div
													className={cn(
														"flex items-center space-x-2 cursor-pointer",
														header.column.getCanSort() &&
															"hover:bg-muted/50 p-2 rounded-md",
													)}
													onClick={() =>
														header.column.toggleSorting(
															header.column.getIsSorted() === "asc",
														)
													}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
												</div>
												{!header.isPlaceholder &&
													header.column.getCanFilter() && (
														<ColumnFilter column={header.column} />
													)}
											</div>
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className={GeistMono.className}>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									Loading...
								</TableCell>
							</TableRow>
						) : error ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-red-500"
								>
									{error}
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
					<Select
						value={table.getState().pagination.pageSize.toString()}
						onValueChange={(value) => table.setPageSize(Number(value))}
					>
						<SelectTrigger className="w-[100px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={pageSize.toString()}>
									Show {pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
