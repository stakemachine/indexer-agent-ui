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
    setFilters((prev) => {
      const existing = prev.find((f) => f.id === id);
      if (existing) return prev.map((f) => (f.id === id ? { ...f, value } : f));
      return [...prev, { id, value }];
    });
  }, []);

  const clear = React.useCallback(() => {
    // Setting filters to empty triggers effect above which will remove the key.
    setFilters([]);
  }, []);

  return { filters, setFilters, upsert, clear };
}
