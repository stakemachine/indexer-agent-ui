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

import { ChevronDownIcon, FilterIcon, RefreshCwIcon, XIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { usePersistedFilters } from "@/components/data-grid-filters/usePersistedFilters";
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
  /**
   * Enable the experimental filter sidebar.
   * When true, a toggle button ("Filters") appears in the toolbar and an `<aside>` panel
   * renders with text filter inputs inferred from string-like columns.
   * Default: false (opt-in / pilot rollout only).
   */
  enableFilterSidebar?: boolean;
  /**
   * Initial sidebar filters to seed when the component mounts.
   * Useful for deep links or restoring state from a higher-level store.
   * Each object should contain a column id and value.
   */
  initialFilters?: { id: string; value: unknown }[];
  /**
   * Callback invoked (debounced ~150ms) whenever the sidebar filter set changes.
   * Receives the full active filter collection. Use for analytics, URL sync, etc.
   */
  onFiltersChange?: (filters: { id: string; value: unknown }[]) => void;
  /**
   * localStorage key to persist sidebar filters. When provided:
   * - On mount: attempts to hydrate saved filters
   * - On change: saves current filters
   * - On clear: removes the stored entry
   */
  persistKey?: string;
}

interface MultiFacetFilterValue {
  __multi: true;
  values: string[];
}

type SidebarFilterValue = string | MultiFacetFilterValue;

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
  // experimental props (not yet used; reserved for future tasks T013+)
  enableFilterSidebar: _enableFilterSidebar,
  initialFilters: _initialFilters,
  onFiltersChange: _onFiltersChange,
  persistKey: _persistKey,
}: DataGridProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting || []);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialState?.columnFilters || []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  // sidebar state (experimental)
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = React.useState(false);
  const {
    filters: sidebarFilters,
    upsert: upsertSidebarFilter,
    clear: clearSidebarFilters,
  } = usePersistedFilters({
    initial: _initialFilters,
    persistKey: _persistKey,
    onChange: _onFiltersChange,
    debounceMs: 150,
  });
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

  // Augment columns with custom filter function supporting text or multi-value facets
  const augmentedColumns = React.useMemo(() => {
    return columns.map((c) => {
      const withAny = c as unknown as { filterFn?: unknown };
      return {
        ...c,
        filterFn: withAny.filterFn || "textOrMulti",
      } as ColumnDef<TData, TValue>;
    });
  }, [columns]);

  const table = useReactTable({
    data,
    columns: augmentedColumns,
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
    filterFns: {
      textOrMulti: (row, columnId, filterValue: SidebarFilterValue) => {
        const raw = row.getValue(columnId);
        if (filterValue == null || (typeof filterValue === "string" && filterValue === "")) return true;
        if (typeof filterValue === "object" && (filterValue as MultiFacetFilterValue).__multi) {
          const values = (filterValue as MultiFacetFilterValue).values;
          return values.length === 0 || values.includes(String(raw ?? ""));
        }
        // default substring match
        if (typeof raw === "string" && typeof filterValue === "string") {
          return raw.toLowerCase().includes(filterValue.toLowerCase());
        }
        return true;
      },
    },
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

  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter !== "" || sidebarFilters.length > 0;

  // Apply sidebarFilters to react-table columnFilters (simple text contains semantics)
  useEffect(() => {
    if (sidebarFilters.length === 0) return;
    // Merge with any existing columnFilters (prioritize sidebar ones by id)
    setColumnFilters((prev) => {
      const others = prev.filter((p) => !sidebarFilters.some((s) => s.id === p.id));
      return [...others, ...sidebarFilters.map((f) => ({ id: f.id, value: f.value }))];
    });
  }, [sidebarFilters]);

  // (persistence + debounced onChange handled in hook)

  // Build list of text columns (string-like) for sidebar inputs
  const textColumns = React.useMemo(() => {
    if (!_enableFilterSidebar) return [] as Column<TData, TValue>[];
    return table
      .getAllLeafColumns()
      .filter((c) => c.getCanFilter())
      .filter((c) => {
        // Try sample first row value to decide if string-like
        const rows = table.getPreFilteredRowModel().flatRows;
        const sample = rows[0]?.getValue(c.id);
        return typeof sample === "string" || sample === undefined || sample === null;
      });
  }, [_enableFilterSidebar, table]);

  // Build distinct value map for low-cardinality columns (<=10 distinct non-empty)
  const facetValues = React.useMemo(() => {
    const map: Record<string, { value: string; count: number }[]> = {};
    const rows = table.getPreFilteredRowModel().flatRows;
    textColumns.forEach((col) => {
      const freq: Record<string, number> = {};
      rows.forEach((r) => {
        const v = r.getValue(col.id);
        if (typeof v === "string" && v.trim() !== "") {
          freq[v] = (freq[v] || 0) + 1;
        }
      });
      const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0 && entries.length <= 10) {
        map[col.id] = entries.map(([value, count]) => ({ value, count }));
      }
    });
    return map;
  }, [textColumns, table]);

  const handleFilterInputChange = (columnId: string, value: string) => {
    upsertSidebarFilter(columnId, value);
  };

  const clearFilters = () => {
    clearSidebarFilters();
    setColumnFilters([]);
    setGlobalFilter("");
  };

  const sidebarOpen = _enableFilterSidebar && isFilterSidebarOpen;
  return (
    <div className="space-y-4 relative">
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
          {_enableFilterSidebar && (
            <Button
              variant="outline"
              onClick={() => setIsFilterSidebarOpen((o) => !o)}
              aria-expanded={isFilterSidebarOpen}
              aria-controls="data-grid-filter-sidebar"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filters
            </Button>
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
      {/* Main data region: on desktop we constrain height to viewport so sidebar + table can scroll independently */}
      <div
        className={cn(
          "md:flex md:gap-4 md:items-stretch md:overflow-hidden",
          // Height calc leaves room for global header (outside component) + search/toolbar (above) + pagination (below)
          // Adjust the 260px constant if surrounding layout spacing changes.
          "md:h-[calc(100vh-260px)]",
          sidebarOpen && "",
        )}
      >
        {sidebarOpen && (
          <aside
            id="data-grid-filter-sidebar"
            aria-label="Filters"
            data-overlay-mobile="true"
            className="absolute top-0 left-0 h-full w-64 border-r bg-background shadow-lg z-10 flex flex-col md:static md:h-full md:shadow-none md:border md:border-r md:rounded-md md:w-64"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h2 className="text-sm font-medium">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close filters"
                onClick={() => setIsFilterSidebarOpen(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="space-y-4">
                {textColumns.map((col) => {
                  const currentFilter = sidebarFilters.find((f) => f.id === col.id)?.value as
                    | SidebarFilterValue
                    | undefined;
                  const textValue = typeof currentFilter === "string" ? currentFilter : "";
                  const multiSelected: string[] =
                    typeof currentFilter === "object" && (currentFilter as MultiFacetFilterValue)?.__multi
                      ? (currentFilter as MultiFacetFilterValue).values
                      : [];
                  const facets = facetValues[col.id];
                  return (
                    <div key={col.id} className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor={`filter-${col.id}`} className="text-xs font-medium uppercase tracking-wide">
                          {col.id}
                        </Label>
                        <Input
                          id={`filter-${col.id}`}
                          value={textValue}
                          placeholder={`Filter ${col.id}`}
                          onChange={(e) => handleFilterInputChange(col.id, e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {facets && (
                        <div className="flex flex-wrap gap-1">
                          {facets.map((fv) => {
                            const active = multiSelected.includes(fv.value);
                            return (
                              <button
                                key={fv.value}
                                type="button"
                                onClick={() => {
                                  // toggle value in multi selection
                                  const next = active
                                    ? multiSelected.filter((v) => v !== fv.value)
                                    : [...multiSelected, fv.value];
                                  upsertSidebarFilter(col.id, { __multi: true, values: next } as MultiFacetFilterValue);
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded-md border text-xs flex items-center gap-1",
                                  active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
                                )}
                                aria-pressed={active}
                              >
                                <span>{fv.value}</span>
                                <span className="opacity-70">{fv.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {textColumns.length === 0 && (
                  <p className="text-xs text-muted-foreground">No text columns available.</p>
                )}
              </div>
            </div>
            <div className="border-t p-3 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
                disabled={sidebarFilters.length === 0 && !globalFilter}
              >
                Clear Filters
              </Button>
              <span className="text-xs text-muted-foreground">{sidebarFilters.length} active</span>
            </div>
          </aside>
        )}
        <div className="rounded-md border md:flex-1 md:order-2 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-auto">
            <Table className="relative">
              <TableHeader className="sticky top-0 z-10 bg-background">
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
              <TableBody className={cn(GeistMono.className)}>
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
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
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
        </div>
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
      <div aria-live="polite" className="sr-only" data-row-count-announcer>
        {table.getRowModel().rows.length} rows
      </div>
    </div>
  );
}
