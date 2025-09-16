import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData, type MockRow } from "./utils/buildTableData";

// T004: Sidebar toggle visibility (will fail until feature implemented)
describe("DataGrid filter sidebar toggle", () => {
  const columns = buildColumns();
  const data = buildTableData({ count: 5 });

  it("does not render Filters toggle when enableFilterSidebar not set", () => {
    render(<DataGrid<MockRow, unknown> columns={columns} data={data} />);
    expect(screen.queryByRole("button", { name: /filters/i })).toBeNull();
  });

  it("renders Filters toggle when enableFilterSidebar true", () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    expect(screen.getByRole("button", { name: /filters/i })).toBeInTheDocument();
  });
});
