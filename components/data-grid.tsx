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

import { ChevronDownIcon, PanelRightClose, PanelRightOpen, RefreshCwIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { usePersistedFilters } from "@/components/data-grid-filters/usePersistedFilters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMounted } from "@/hooks/use-mounted";
import { cn, toGRTNumber } from "@/lib/utils";

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

interface RangeFilterValue {
  __range: true;
  min?: number | null;
  max?: number | null;
}

type SidebarFilterValue = string | MultiFacetFilterValue | RangeFilterValue;

import { DataTablePagination } from "./data-table-pagination";

type RowWithSubRows<TData> = TData & { subRows?: RowWithSubRows<TData>[] };

import type { Column } from "@tanstack/react-table";
// Column header filter UI removed: filtering is handled exclusively by the sidebar.

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
  const mounted = useMounted();
  const autoRefresh = autoRefreshEnabled !== undefined ? autoRefreshEnabled : internalAutoRefresh;

  const handleAutoRefreshChange = React.useCallback(
    (enabled: boolean) => {
      if (onAutoRefreshChange) {
        onAutoRefreshChange(enabled);
      } else {
        setInternalAutoRefresh(enabled);
      }
    },
    [onAutoRefreshChange],
  );

  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Augment columns with custom filter function supporting text, multi-facet, and numeric ranges
  const augmentedColumns = React.useMemo(() => {
    return columns.map((c) => {
      const withAny = c as unknown as { filterFn?: unknown };
      return {
        ...c,
        filterFn: withAny.filterFn || "textMultiOrRange",
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
      textMultiOrRange: (row, columnId, filterValue: SidebarFilterValue) => {
        const raw = row.getValue(columnId);
        if (filterValue == null || (typeof filterValue === "string" && filterValue === "")) return true;
        // multi-value facet
        if (typeof filterValue === "object" && (filterValue as MultiFacetFilterValue).__multi) {
          const values = (filterValue as MultiFacetFilterValue).values;
          return values.length === 0 || values.includes(String(raw ?? ""));
        }
        // numeric range
        if (typeof filterValue === "object" && (filterValue as RangeFilterValue).__range) {
          const { min, max } = filterValue as RangeFilterValue;
          // Coerce raw to number when possible
          let n: number | null = null;
          if (typeof raw === "number") {
            n = raw;
          } else if (typeof raw === "string") {
            // Try normalized GRT from wei if this is a big-integer-like string; fallback to plain number
            const grt = toGRTNumber(raw);
            if (grt != null) n = grt;
            else {
              const parsed = Number(raw);
              n = Number.isFinite(parsed) ? parsed : null;
            }
          } else if (typeof raw === "bigint") {
            const grt = toGRTNumber(raw);
            n = grt;
          }
          // If bounds are effectively empty, don't filter
          const hasMin = typeof min === "number" && !Number.isNaN(min);
          const hasMax = typeof max === "number" && !Number.isNaN(max);
          if (!hasMin && !hasMax) return true;
          if (n == null) return false; // cannot evaluate numeric range
          if (hasMin && n < (min as number)) return false;
          if (hasMax && n > (max as number)) return false;
          return true;
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

  // Apply sidebarFilters to react-table columnFilters (exact mirror)
  useEffect(() => {
    if (sidebarFilters.length === 0) {
      setColumnFilters([]);
      return;
    }
    setColumnFilters(sidebarFilters.map((f) => ({ id: f.id, value: f.value })));
  }, [sidebarFilters]);

  // (persistence + debounced onChange handled in hook)

  // Helper: find the first non-empty sample value for a column from the pre-filtered rows
  const firstNonEmptySample = React.useCallback(
    (columnId: string) => {
      const rows = table.getPreFilteredRowModel().flatRows;
      for (let i = 0; i < rows.length; i++) {
        const v = rows[i]?.getValue(columnId);
        if (v === undefined || v === null) continue;
        if (typeof v === "string" && v.trim() === "") continue;
        return v;
      }
      return undefined;
    },
    [table],
  );

  // Build list of text columns (string-like) for sidebar inputs (recomputed each render)
  const textColumns = (() => {
    if (!_enableFilterSidebar) return [] as Column<TData, TValue>[];
    return table
      .getAllLeafColumns()
      .filter((c) => c.getCanFilter())
      .filter((c) => {
        const sample = firstNonEmptySample(c.id);
        if (typeof sample === "string") {
          const asNum = Number(sample);
          return !Number.isFinite(asNum);
        }
        return false;
      });
  })();

  // Build list of numeric columns for sidebar range inputs (recomputed each render)
  const numericColumns = (() => {
    if (!_enableFilterSidebar) return [] as Column<TData, TValue>[];
    return table
      .getAllLeafColumns()
      .filter((c) => c.getCanFilter())
      .filter((c) => {
        const sample = firstNonEmptySample(c.id);
        if (typeof sample === "number") return true;
        if (typeof sample === "string") {
          const parsed = Number(sample);
          return Number.isFinite(parsed);
        }
        return false;
      });
  })();

  // Build distinct value map for string columns; show up to TOP_K most frequent non-empty values
  const facetValues: Record<string, { value: string; count: number }[]> = (() => {
    if (!_enableFilterSidebar) return {};
    const map: Record<string, { value: string; count: number }[]> = {};
    const rows = table.getPreFilteredRowModel().flatRows;
    textColumns.forEach((col) => {
      // Respect column meta flag to disable facet helpers
      const meta = (col.columnDef as { meta?: Record<string, unknown> }).meta as
        | { disableFacetHelpers?: boolean }
        | undefined;
      if (meta?.disableFacetHelpers) return;
      const freq: Record<string, number> = {};
      rows.forEach((r) => {
        const v = r.getValue(col.id);
        if (typeof v === "string" && v.trim() !== "") {
          freq[v] = (freq[v] || 0) + 1;
        }
      });
      const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0) {
        const TOP_K = 10;
        const top = entries.slice(0, TOP_K);
        map[col.id] = top.map(([value, count]) => ({ value, count }));
      }
    });
    return map;
  })();

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
    <div className="relative w-full">
      {/* Main layout container with sidebar */}
      <div className={cn("flex w-full", _enableFilterSidebar ? "h-screen" : "flex-col space-y-4")}>
        {/* Sidebar - following the screenshot layout pattern */}
        {_enableFilterSidebar && sidebarOpen && (
          <aside
            id="data-grid-filter-sidebar"
            aria-labelledby="data-grid-filter-heading"
            data-overlay-mobile="true"
            className="w-64 flex-shrink-0 bg-background border-r border-border flex flex-col"
          >
            {/* Sidebar header */}
            <div className="border-b border-border bg-background px-6 py-4 h-14">
              <h2 id="data-grid-filter-heading" className="text-lg font-semibold text-foreground">
                Filters
              </h2>
            </div>

            {/* Sidebar content - scrollable */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Numeric range filters */}
                {numericColumns.map((col) => {
                  const currentFilter = sidebarFilters.find((f) => f.id === col.id)?.value as
                    | SidebarFilterValue
                    | undefined;
                  const range =
                    typeof currentFilter === "object" && (currentFilter as RangeFilterValue)?.__range
                      ? (currentFilter as RangeFilterValue)
                      : ({ __range: true, min: null, max: null } as RangeFilterValue);
                  const minVal = range.min ?? "";
                  const maxVal = range.max ?? "";
                  return (
                    <div key={col.id} className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">{col.id}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Min"
                          value={minVal}
                          onChange={(e) => {
                            const v = e.target.value;
                            const min = v === "" ? null : Number(v);
                            upsertSidebarFilter(col.id, { __range: true, min, max: range.max } as RangeFilterValue);
                          }}
                          className="h-9"
                          aria-label={`${col.id} min`}
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Max"
                          value={maxVal}
                          onChange={(e) => {
                            const v = e.target.value;
                            const max = v === "" ? null : Number(v);
                            upsertSidebarFilter(col.id, { __range: true, min: range.min, max } as RangeFilterValue);
                          }}
                          className="h-9"
                          aria-label={`${col.id} max`}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Text filters with facet chips */}
                {textColumns.map((col) => {
                  const currentFilter = sidebarFilters.find((f) => f.id === col.id)?.value as
                    | SidebarFilterValue
                    | undefined;
                  const textValue = typeof currentFilter === "string" ? currentFilter : "";
                  const multiSelected: string[] =
                    typeof currentFilter === "object" && (currentFilter as MultiFacetFilterValue)?.__multi
                      ? (currentFilter as MultiFacetFilterValue).values
                      : [];
                  const meta = (col.columnDef as { meta?: Record<string, unknown> }).meta as
                    | { disableFacetHelpers?: boolean }
                    | undefined;
                  const facets = meta?.disableFacetHelpers ? undefined : facetValues[col.id];
                  return (
                    <div key={col.id} className="space-y-2">
                      <div className="space-y-2">
                        <Label htmlFor={`filter-${col.id}`} className="text-sm font-medium text-foreground">
                          {col.id}
                        </Label>
                        <Input
                          id={`filter-${col.id}`}
                          value={textValue}
                          placeholder={`Filter ${col.id}`}
                          onChange={(e) => handleFilterInputChange(col.id, e.target.value)}
                          className="h-9"
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
                {numericColumns.length === 0 && textColumns.length === 0 && (
                  <p className="text-sm text-muted-foreground">No text columns available.</p>
                )}
              </div>
            </div>

            {/* Sidebar footer */}
            <div className="border-t border-border bg-background px-6 py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearFilters}
                  disabled={sidebarFilters.length === 0 && !globalFilter}
                >
                  Clear Filters
                </Button>
                <span className="text-sm text-muted-foreground">{sidebarFilters.length} active</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Toolbar */}
          <div className="border-b border-border bg-background flex-shrink-0">
            {/* Search bar - full width */}
            <div className="px-6 py-4">
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setGlobalFilter(value);
                }}
                className="w-full h-8"
              />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                {_enableFilterSidebar && (
                  <Button
                    variant="outline"
                    onClick={() => setIsFilterSidebarOpen((o) => !o)}
                    aria-expanded={isFilterSidebarOpen}
                    aria-controls="data-grid-filter-sidebar"
                    aria-label={isFilterSidebarOpen ? "Hide filters" : "Show filters"}
                    className="h-8 px-3"
                  >
                    {isFilterSidebarOpen ? (
                      <>
                        <PanelRightOpen className="h-4 w-4" />
                        Hide Filters
                      </>
                    ) : (
                      <>
                        <PanelRightClose className="h-4 w-4" />
                        Show Filters
                      </>
                    )}
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} of {data.length} row(s) filtered
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {onRefresh && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="auto-refresh-switch" className="text-sm whitespace-nowrap">
                        Auto-refresh
                      </Label>
                      <Switch
                        id="auto-refresh-switch"
                        checked={autoRefresh}
                        onCheckedChange={handleAutoRefreshChange}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={isLoading || isValidating}
                      aria-label="Refresh"
                    >
                      <RefreshCwIcon className={`h-4 w-4 ${isLoading || isValidating ? "animate-spin" : ""}`} />
                    </Button>
                  </>
                )}
                {mounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" aria-label="Columns">
                        <ChevronDownIcon className="h-4 w-4" />
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
                ) : (
                  <Skeleton className="h-8 w-8" />
                )}
              </div>
            </div>
          </div>

          {/* Table container with chart area and main table */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Table */}
            <div className="flex-1 overflow-auto min-h-0">
              <div className="relative w-full overflow-auto">
                <Table className="w-full caption-bottom text-sm relative min-w-[600px]">
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
                                {/* Header filter controls removed; use sidebar filters instead. */}
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
                              <TableCell colSpan={columns.length}>
                                {renderSubComponent(row.original as TData)}
                              </TableCell>
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

          {/* Pagination and batch actions */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-background">
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
      </div>

      {/* Accessibility */}
      <div aria-live="polite" className="sr-only" data-row-count-announcer>
        {table.getRowModel().rows.length} rows
      </div>
    </div>
  );
}
