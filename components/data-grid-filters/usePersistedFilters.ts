import * as React from "react";

export interface PersistedFilterDescriptor {
  id: string;
  value: unknown;
}

export interface UsePersistedFiltersOptions {
  initial?: PersistedFilterDescriptor[];
  persistKey?: string;
  onChange?: (filters: PersistedFilterDescriptor[]) => void;
  debounceMs?: number;
}

export function usePersistedFilters({ initial, persistKey, onChange, debounceMs = 150 }: UsePersistedFiltersOptions) {
  const [filters, setFilters] = React.useState<PersistedFilterDescriptor[]>(() => initial || []);

  // Hydrate
  React.useEffect(() => {
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFilters(parsed);
      }
    } catch {
      // ignore
    }
    // only run once for key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  // Persist (remove key if no filters)
  React.useEffect(() => {
    if (!persistKey) return;
    try {
      if (filters.length === 0) {
        localStorage.removeItem(persistKey);
      } else {
        localStorage.setItem(persistKey, JSON.stringify(filters));
      }
    } catch {
      // ignore
    }
  }, [filters, persistKey]);

  // Debounced change callback
  React.useEffect(() => {
    if (!onChange) return;
    const handle = setTimeout(() => onChange(filters), debounceMs);
    return () => clearTimeout(handle);
  }, [filters, onChange, debounceMs]);

  const upsert = React.useCallback((id: string, value: unknown) => {
    const isInactive = (val: unknown) => {
      if (val == null) return true;
      if (typeof val === "string") return val.trim() === "";
      if (Array.isArray(val)) return val.length === 0;
      if (typeof val === "object") {
        const anyVal = val as { __multi?: unknown; values?: unknown; __range?: unknown; min?: unknown; max?: unknown };
        if (anyVal?.__multi && Array.isArray(anyVal.values)) {
          return (anyVal.values as unknown[]).length === 0;
        }
        if (anyVal?.__range) {
          const min = anyVal.min as unknown;
          const max = anyVal.max as unknown;
          const empty = (v: unknown) => v == null || (typeof v === "number" && Number.isNaN(v));
          return empty(min) && empty(max);
        }
      }
      return false;
    };

    setFilters((prev) => {
      const exists = prev.some((f) => f.id === id);
      if (isInactive(value)) {
        // Remove filter if value is empty/inactive
        return prev.filter((f) => f.id !== id);
      }
      if (exists) return prev.map((f) => (f.id === id ? { ...f, value } : f));
      return [...prev, { id, value }];
    });
  }, []);

  const clear = React.useCallback(() => {
    // Setting filters to empty triggers effect above which will remove the key.
    setFilters([]);
  }, []);

  return { filters, setFilters, upsert, clear };
}
