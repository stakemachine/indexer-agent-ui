import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";
import { buildColumns, buildTableData } from "./utils/buildTableData";

// T007: Hide/show preservation of filter input values
describe("DataGrid filter hide/show persistence", () => {
  const columns = buildColumns();
  const data = buildTableData();

  it("keeps filter values after closing and reopening sidebar", () => {
    // biome-ignore lint/suspicious/noExplicitAny: experimental prop injection before implementation
    const DG = DataGrid as any;
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const toggle = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const nameInput = screen.getByPlaceholderText(/filter name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Row 3" } });
    // Close
    fireEvent.click(screen.getByLabelText(/close filters/i));
    // Reopen
    fireEvent.click(toggle);
    const nameInputAgain = screen.getByPlaceholderText(/filter name/i) as HTMLInputElement;
    expect(nameInputAgain.value).toBe("Row 3");
  });
});
