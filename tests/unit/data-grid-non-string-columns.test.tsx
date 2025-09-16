import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";

// T026: Non-string columns should not generate text inputs in sidebar

type Row = { id: number; numeric: number; bool: boolean; meta: { nested: string } };
const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "numeric", header: "Numeric" },
  { accessorKey: "bool", header: "Bool" },
  { accessorKey: "meta", header: "Meta" },
];

const data: Row[] = Array.from({ length: 5 }).map((_, i) => ({
  id: i + 1,
  numeric: i * 10,
  bool: i % 2 === 0,
  meta: { nested: `n${i}` },
}));

describe("DataGrid non-string columns", () => {
  it("renders no text inputs for purely non-string columns", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    // Should show fallback message
    expect(screen.getByText(/no text columns available/i)).toBeInTheDocument();
  });
});
