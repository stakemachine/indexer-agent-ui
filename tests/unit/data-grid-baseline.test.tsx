import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock geist/font to sidestep next/font local directory import issues under Vitest (jsdom)
vi.mock("geist/font/mono", () => ({ GeistMono: { className: "geist-mono" } }));

import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/data-grid";

interface RowType {
  id: number;
  name: string;
  value: number;
}

const columns: ColumnDef<RowType>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name,
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => row.original.value,
    enableSorting: true,
    enableColumnFilter: true,
  },
];

const data: RowType[] = Array.from({ length: 15 }).map((_, i) => ({ id: i + 1, name: `Row ${i + 1}`, value: i * 10 }));

// Baseline structural assertions: ensure key UI elements exist so future changes that break them will surface.
describe("DataGrid baseline", () => {
  it("renders global search input, columns menu trigger, refresh controls placeholder state, pagination, and table rows", () => {
    const handleRefresh = () => {};
    render(
      <DataGrid
        columns={columns}
        data={data}
        onRefresh={handleRefresh}
        initialState={{ pagination: { pageIndex: 0, pageSize: 10 } }}
      />,
    );

    // Global search input
    const searchInput = screen.getByPlaceholderText(/search all columns/i);
    expect(searchInput).toBeInTheDocument();

    // Columns button (trigger)
    const columnsButton = screen.getByRole("button", { name: /columns/i });
    expect(columnsButton).toBeInTheDocument();

    // Refresh button (since onRefresh supplied)
    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    // Auto-refresh switch label
    expect(screen.getByLabelText(/auto-refresh/i)).toBeInTheDocument();

    // Table element and header cells
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThanOrEqual(3);

    // Rows (first page limited by pagination: expect 10 data rows)
    const rows = within(table).getAllByRole("row");
    // rows include header row(s); so data rows >= 10
    // Filter out rows that have column headers
    const dataRowCount = rows.filter((r) => within(r).queryAllByRole("columnheader").length === 0).length;
    expect(dataRowCount).toBeGreaterThanOrEqual(10);

    // Pagination status text ("row(s) selected.")
    expect(screen.getByText(/row\(s\) selected\./i)).toBeInTheDocument();
  });
});
