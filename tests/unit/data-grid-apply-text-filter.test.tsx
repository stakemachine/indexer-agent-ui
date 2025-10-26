import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T005: Applying a text filter reduces visible rows (pending UI implementation)
describe("DataGrid apply text filter", () => {
  const columns = buildColumns();
  const data = buildTableData({ count: 20 });

  it("reduces rows after entering a filter value", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    // Open sidebar
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Row count before
    const table = screen.getByRole("table");
    const initialRows = table.querySelectorAll("tbody tr").length;
    expect(initialRows).toBeGreaterThan(1);

    // Choose unique value Row 17
    const input = (await screen.findByPlaceholderText(/filter name/i)) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Row 17" } });

    await waitFor(() => {
      const filteredRows = table.querySelectorAll("tbody tr").length;
      expect(filteredRows).toBeLessThan(initialRows);
    });
  });
});
