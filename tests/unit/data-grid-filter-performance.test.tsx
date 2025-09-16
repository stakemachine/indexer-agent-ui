import type { ColumnDef } from "@tanstack/react-table";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/data-grid";

// T024: Performance measurement (lightweight heuristic)
// Goal: Ensure render with 1000 rows & 5 columns + sidebar mounts under a loose threshold.
// NOTE: This is a heuristic; if flaky, adjust or snapshot time buckets.

type Row = { id: number; name: string; category: string; v: number; tag: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "v", header: "Value" },
  { accessorKey: "tag", header: "Tag" },
];

const buildRows = (n: number): Row[] =>
  Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    name: `Row ${i + 1}`,
    category: ["alpha", "beta", "gamma", "delta"][i % 4],
    v: i,
    tag: `t${i % 10}`,
  }));

describe("DataGrid performance", () => {
  it("mounts 1000 rows with sidebar under ~300ms", () => {
    // biome-ignore lint/suspicious/noExplicitAny: test internal
    const DG = DataGrid as any;
    const data = buildRows(1000);
    const start = performance.now();
    render(<DG columns={columns} data={data} enableFilterSidebar />);
    const duration = performance.now() - start;
    // Generous threshold for CI variance; adjust if consistently higher.
    expect(duration).toBeLessThan(300);
  });
});
