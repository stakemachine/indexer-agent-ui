# DataGrid Filter Sidebar Quickstart (T023)

This guide explains how to enable and use the experimental filter sidebar in the `DataGrid`.

## 1. Enable the Sidebar
Pass the `enableFilterSidebar` prop to a `DataGrid` instance.

```tsx
<DataGrid
  columns={columns}
  data={rows}
  enableFilterSidebar
/>
```

Only enable it selectively (pilot) until the feature is considered stable.

## 2. Filtering Behavior
- The sidebar lists one input per string-like column (determined via sample row inspection).
- Each input performs a case-insensitive contains match (AND semantics across multiple columns).
- A badge "Filtered" appears in the toolbar when any filter or global search is active.

## 3. Clear Filters
Use the "Clear Filters" button in the sidebar footer to reset:
- Column filters created via the sidebar
- Global search text
- Persisted localStorage entry (if `persistKey` provided)

## 4. Persistence
Provide a `persistKey` to persist filter state across reloads:
```tsx
<DataGrid
  columns={columns}
  data={rows}
  enableFilterSidebar
  persistKey="allocations:filters:v1"
/>
```

## 5. Initial Filters
Seed the sidebar with starting filters:
```tsx
<DataGrid
  columns={columns}
  data={rows}
  enableFilterSidebar
  initialFilters={[{ id: 'name', value: 'alpha' }]}
/>
```

## 6. Change Notifications
Receive updates (debounced ~150ms) whenever filters change:
```tsx
<DataGrid
  columns={columns}
  data={rows}
  enableFilterSidebar
  onFiltersChange={(filters) => {
    console.log('Filters changed', filters);
  }}
/>
```

## 7. Accessibility
- Toggle button exposes `aria-expanded` and `aria-controls`.
- Sidebar rendered as `<aside aria-label="Filters" role="complementary">`.
- Close button: `aria-label="Close filters"`.

## 8. Mobile (Placeholder)
Mobile overlay behavior is still experimental (T010/T021). Expect adjustments—avoid relying on layout specifics.

## 9. Limitations / Notes
- Only string-like columns receive inputs; others ignored.
- Filtering is simple contains; no numeric/date operators yet.
- Global search still operates independently and can combine with sidebar filters.

## 10. Rollout Strategy
1. Enable on a single high-signal table (done for allocations).
2. Collect feedback and measure performance (see performance test T024).
3. Gradually enable elsewhere once stable.

---
Status: Draft complete for T023.
