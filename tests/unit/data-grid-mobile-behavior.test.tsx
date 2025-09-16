import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";

// T031: Mobile overlay behavior - treat sidebar as overlay (data attribute present)

type Row = { id: number; name: string };
const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];
const data: Row[] = Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

describe("DataGrid filter sidebar mobile behavior", () => {
  it("applies data-overlay-mobile attribute and acts as layer", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    const aside = screen.getByRole("complementary", { name: /filters/i });
    expect(aside).toHaveAttribute("data-overlay-mobile", "true");
  });
});
