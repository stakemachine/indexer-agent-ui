import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";

// T027: Numeric range filters work for min-only, max-only, and both bounds, and clear correctly

type Row = { n: number; label: string };
const columns: ColumnDef<Row>[] = [
  { accessorKey: "n", header: "N" },
  { accessorKey: "label", header: "Label" },
];

const data: Row[] = [
  { n: 1, label: "a" },
  { n: 5, label: "b" },
  { n: 10, label: "c" },
];

describe("DataGrid numeric range filters", () => {
  it("filters with min-only, max-only, both, and clearing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);

    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);

    const minInput = screen.getByLabelText(/n min/i) as HTMLInputElement;
    const maxInput = screen.getByLabelText(/n max/i) as HTMLInputElement;

    // min-only >= 5 should leave two rows (5 and 10)
    fireEvent.change(minInput, { target: { value: "5" } });
    expect(screen.getByText(/2 of 3 row\(s\) filtered/i)).toBeInTheDocument();

    // both bounds 5..9 should leave one row (5)
    fireEvent.change(maxInput, { target: { value: "9" } });
    expect(screen.getByText(/1 of 3 row\(s\) filtered/i)).toBeInTheDocument();

    // clear min -> only <= 9 should leave two rows (1 and 5)
    fireEvent.change(minInput, { target: { value: "" } });
    expect(screen.getByText(/2 of 3 row\(s\) filtered/i)).toBeInTheDocument();

    // clear max -> all rows
    fireEvent.change(maxInput, { target: { value: "" } });
    expect(screen.getByText(/3 of 3 row\(s\) filtered/i)).toBeInTheDocument();
  });
});
