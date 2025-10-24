import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T011: Accessibility roles & attributes
describe("DataGrid filter sidebar accessibility", () => {
  const columns = buildColumns();
  const data = buildTableData();

  it("provides aria attributes on toggle & complementary region", () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Multiple asides can briefly exist due to strict mode double render; pick first
    const asides = screen.getAllByLabelText(/filters/i);
    const aside = asides[0];
    expect(aside.tagName.toLowerCase()).toBe("aside");
    // Row count live announcer present
    expect(screen.getByText(/rows$/)).toBeInTheDocument();
    // Close
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
