import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T006: Multiple filters combine with AND semantics
describe("DataGrid multi-filter AND", () => {
  const columns = buildColumns();
  const data = buildTableData({ count: 30 });

  it("applies AND logic across two filters", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const table = screen.getByRole("table");
    const baseline = table.querySelectorAll("tbody tr").length;
    expect(baseline).toBeGreaterThan(5);

    // Filter name: Row 12
    const nameInput = (await screen.findByPlaceholderText(/filter name/i)) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Row 12" } });

    // Also filter category: pick category for row 12 (rows generated cyclical 4 categories; row 12 => index 11 => 11 % 4 = 3 => 'delta')
    const categoryInput = (await screen.findByPlaceholderText(/filter category/i)) as HTMLInputElement;
    fireEvent.change(categoryInput, { target: { value: "delta" } });

    await waitFor(() => {
      const rowsNow = table.querySelectorAll("tbody tr").length;
      expect(rowsNow).toBeLessThan(baseline);
      // Should typically narrow to 1 row
      expect(rowsNow).toBe(1);
    });
  });
});
