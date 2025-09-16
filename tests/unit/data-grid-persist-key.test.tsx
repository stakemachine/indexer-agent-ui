import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T009: Persistence via persistKey
describe("DataGrid filter persistence", () => {
  const columns = buildColumns();
  const data = buildTableData();

  beforeEach(() => {
    localStorage.clear();
  });

  it("rehydrates prior filters from localStorage", () => {
    const key = "dg:test:persist";
    // First render to set a value
    // biome-ignore lint/suspicious/noExplicitAny: DataGrid internal for tests
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar persistKey={key} />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const nameInput = screen.getByPlaceholderText(/filter name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Row 8" } });
    // Unmount and remount
    cleanup();
    render(<DG columns={columns} data={data} enableFilterSidebar persistKey={key} />);
    const toggle2 = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle2);
    expect(toggle2).toHaveAttribute("aria-expanded", "true");
    const hydrated = screen.getByPlaceholderText(/filter name/i) as HTMLInputElement;
    expect(hydrated.value).toBe("Row 8");
  });
});
