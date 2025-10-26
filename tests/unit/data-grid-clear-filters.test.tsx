import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T008: Clear Filters action resets state
describe("DataGrid clear filters", () => {
  const columns = buildColumns();
  const data = buildTableData();

  it("resets to original row count after Clear Filters", () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const table = screen.getByRole("table");
    const baseline = table.querySelectorAll("tbody tr").length;
    const category = screen.getByPlaceholderText(/filter category/i) as HTMLInputElement;
    fireEvent.change(category, { target: { value: "alpha" } });
    const filtered = table.querySelectorAll("tbody tr").length;
    expect(filtered).toBeLessThanOrEqual(baseline);
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    const reset = table.querySelectorAll("tbody tr").length;
    expect(reset).toBe(baseline);
  });
});
