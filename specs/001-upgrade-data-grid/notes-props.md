# DataGrid Filter Sidebar Props (Draft)

Status: Draft for upcoming implementation (T012+). All props optional; maintain backward compatibility.

## New / Proposed Props

### enableFilterSidebar?: boolean
Enable rendering of the filter sidebar UI surface and toggle button. Default: false.

Rationale: Opt‑in rollout avoids breaking existing tables and allows incremental adoption.

### initialFilters?: FilterDescriptor[]
Array describing initial column (and potential future global) filters applied on first render.

Example (tentative):
```ts
[{ id: "name", value: "alice" }, { id: "category", value: "alpha" }]
```

### onFiltersChange?: (filters: FilterDescriptor[]) => void
Callback invoked (debounced ~150ms) whenever active filters change via the sidebar.

Use Cases:
- External analytics / telemetry
- Persisting to higher-level store (Zustand) if desired by host page

### persistKey?: string
Key used to serialize active filters to `localStorage`. When provided, the DataGrid will:
1. Attempt to rehydrate filters on mount.
2. Persist after each debounced change.

If absent, no persistence occurs.

## Internal Types (Planned)
```ts
export interface FilterDescriptor {
  id: string;          // column id
  value: unknown;      // primitive/string for v1; could expand later
}
```

## Open Questions / TODO
- Should global (all-columns) search also persist independently? (Currently not in scope.)
- Mobile behavior: overlay or slide-in from bottom? (Pending spec clarification -> impacts aria & layout.)
- Should clearing filters also clear persisted entry or keep last non-empty set? (Tentative: clearing removes stored state.)

## Non-Goals
- Complex operators (>, <, range) for v1; only simple text equality/substring semantics via existing react-table filter fn.
- Server-side filtering; remains client-only initial phase.

## Migration / Safety
- Absence of these props means zero runtime difference for existing usages.
- Implementation guarded by feature flag `enableFilterSidebar`.

## Future Considerations
- Extend `FilterDescriptor` with operator field for advanced numeric/range filtering.
- Add global filter persistence.
- Add controlled mode: external `filters` prop to supersede internal state (not needed v1).
