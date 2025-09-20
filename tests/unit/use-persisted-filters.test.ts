import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { usePersistedFilters } from "@/components/data-grid-filters/usePersistedFilters";

// T029: Tests for usePersistedFilters hook

describe("usePersistedFilters", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates from localStorage when key present", () => {
    localStorage.setItem("pf:key", JSON.stringify([{ id: "name", value: "Alice" }]));
    const { result } = renderHook(() => usePersistedFilters({ persistKey: "pf:key" }));
    expect(result.current.filters).toEqual([{ id: "name", value: "Alice" }]);
  });

  it("upserts and persists filters", () => {
    const { result } = renderHook(() => usePersistedFilters({ persistKey: "pf:key" }));
    act(() => result.current.upsert("name", "Bob"));
    expect(result.current.filters[0]).toEqual({ id: "name", value: "Bob" });
    const stored = JSON.parse(localStorage.getItem("pf:key") || "[]");
    expect(stored).toEqual([{ id: "name", value: "Bob" }]);
  });

  it("clears filters and removes key", () => {
    localStorage.setItem("pf:key", JSON.stringify([{ id: "name", value: "Alice" }]));
    const { result } = renderHook(() => usePersistedFilters({ persistKey: "pf:key" }));
    act(() => result.current.clear());
    expect(result.current.filters).toEqual([]);
    expect(localStorage.getItem("pf:key")).toBeNull();
  });

  it("removes filter when string value becomes empty", () => {
    const { result } = renderHook(() => usePersistedFilters({ persistKey: "pf:key" }));
    act(() => result.current.upsert("name", "Alice"));
    expect(result.current.filters).toEqual([{ id: "name", value: "Alice" }]);
    act(() => result.current.upsert("name", ""));
    expect(result.current.filters).toEqual([]);
  });

  it("removes filter when multi selection becomes empty", () => {
    const { result } = renderHook(() => usePersistedFilters({ persistKey: "pf:key" }));
    act(() => result.current.upsert("status", { __multi: true, values: ["Active", "Denied"] }));
    expect(result.current.filters[0].id).toBe("status");
    act(() => result.current.upsert("status", { __multi: true, values: [] }));
    expect(result.current.filters).toEqual([]);
  });
});
