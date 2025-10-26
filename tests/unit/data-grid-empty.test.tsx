import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";

// T025: Empty dataset behavior with sidebar

type Row = { id: string; name: string };
const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

describe("DataGrid empty dataset", () => {
  it("opens sidebar with no rows and shows fallback message (no inference)", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    render(<DG columns={columns} data={[]} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(screen.getByText(/no text columns available/i)).toBeInTheDocument();
    expect(screen.getByText(/0 active/)).toBeInTheDocument();
  });
});
