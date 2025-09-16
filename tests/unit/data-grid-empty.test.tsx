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
  it("opens sidebar with no rows and shows inputs (string cols inferred)", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    render(<DG columns={columns} data={[]} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    const nameInput = screen.getByPlaceholderText(/filter name/i);
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByText(/0 active/)).toBeInTheDocument();
  });
});
