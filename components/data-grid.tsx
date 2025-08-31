"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { GeistMono } from "geist/font/mono";

import { ChevronDownIcon, FilterIcon, RefreshCwIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  batchActions?: {
    label: string;
    onClick: (selectedRows: TData[]) => void;
  }[];
  renderSubComponent?: (row: TData) => React.ReactNode;
}

import type { Column } from "@tanstack/react-table";
import { DataTablePagination } from "./data-table-pagination";

type RowWithSubRows<TData> = TData & { subRows?: RowWithSubRows<TData>[] };

function ColumnFilter<TData, TValue>({ column }: { column: Column<TData, TValue> }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Filter {column.id}</span>
          <ChevronDownIcon className="h-4 w-4" />
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
  batchActions,
  renderSubComponent,
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting || []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialState?.columnFilters || []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [internalAutoRefresh, setInternalAutoRefresh] = React.useState(false);
  const autoRefresh = autoRefreshEnabled !== undefined ? autoRefreshEnabled : internalAutoRefresh;
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
      columnVisibility,
      expanded,
      globalFilter,
      rowSelection,
    },
    // Prevent pagination from resetting to page 0 when data changes (e.g., SWR revalidation)
    autoResetPageIndex: false,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getSubRows: (row: RowWithSubRows<TData>) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const original = row.original as Record<string, unknown>;
      const searchableValues = Object.entries(original).flatMap(([_key, value]) => {
        if (typeof value === "object" && value !== null) {
          return Object.values(value);
        }
        return value;
      });

      return searchableValues.some((v) => typeof v === "string" && v.toLowerCase().includes(filterValue.toLowerCase()));
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

  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter !== "";

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
            <Badge variant="secondary" className="h-8 px-3 flex items-center space-x-1">
              <FilterIcon className="h-4 w-4" />
              <span>Filtered</span>
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <>
              <Button variant="outline" onClick={onRefresh} disabled={isLoading || isValidating}>
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading || isValidating ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
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
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
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
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={cn(
                              "flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md",
                            )}
                            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                header.column.toggleSorting(header.column.getIsSorted() === "asc");
                              }
                            }}
                            aria-label={`Sort by ${header.column.id}`}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </button>
                        ) : (
                          <span className="flex items-center space-x-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                        {!header.isPlaceholder && header.column.getCanFilter() && (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && renderSubComponent && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>{renderSubComponent(row.original as TData)}</TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DataTablePagination table={table} />
        </div>
        <div className="flex items-center space-x-2">
          {batchActions?.map((action) => (
            <Button
              key={action.label}
              onClick={() => action.onClick(table.getSelectedRowModel?.().rows.map((row) => row.original as TData))}
              disabled={table.getSelectedRowModel?.().rows.length === 0}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
