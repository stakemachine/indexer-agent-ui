import { describe, expect, it } from "vitest";
import { mergeFilters, removeFilter, upsertFilter } from "@/components/data-grid-filters/utils";

describe("filter descriptor utils", () => {
  it("upserts new filter", () => {
    const next = upsertFilter([], "name", "Alice");
    expect(next).toEqual([{ id: "name", value: "Alice" }]);
  });
  it("updates existing filter", () => {
    const next = upsertFilter([{ id: "name", value: "A" }], "name", "B");
    expect(next[0].value).toBe("B");
  });
  it("removes filter", () => {
    const next = removeFilter([{ id: "name", value: 1 }], "name");
    expect(next).toEqual([]);
  });
  it("merges filters prefers incoming order on conflict", () => {
    const merged = mergeFilters(
      [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ],
      [
        { id: "b", value: 3 },
        { id: "c", value: 4 },
      ],
    );
    expect(merged).toContainEqual({ id: "b", value: 3 });
    expect(merged.length).toBe(3);
  });
});
