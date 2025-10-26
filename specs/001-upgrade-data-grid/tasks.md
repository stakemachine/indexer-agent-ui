# Tasks: Upgrade Data Grid with Filter Sidebar

**Input**: Design documents from `/specs/001-upgrade-data-grid/`
**Prerequisites**: plan.md (available). No research.md, data-model.md, contracts/, or quickstart.md yet.

## Execution Flow (main)
(Generated per template; adjusts due to minimal auxiliary docs.)

## Phase 3.1: Setup
- [ ] T001 Confirm existing `components/data-grid.tsx` baseline snapshot in `tests/unit/data-grid-baseline.test.tsx` (create failing test capturing current rendered structure for key elements: search input, columns button, refresh, pagination) – ensures regression detection.
- [ ] T002 [P] Add new test helper factory `tests/unit/utils/buildTableData.ts` for generating mock row data.
- [ ] T003 Create feature flag props draft in a separate spec note file `/specs/001-upgrade-data-grid/notes-props.md` (non-code) enumerating proposed new props: `enableFilterSidebar`, `initialFilters`, `onFiltersChange`, `persistKey`.

## Phase 3.2: Tests First (TDD)
- [ ] T004 Add failing test `tests/unit/data-grid-filters-toggle.test.tsx` verifying: sidebar toggle button ("Filters") not rendered when `enableFilterSidebar` false; rendered when true; clicking toggles visibility region with `role="complementary"`.
- [ ] T005 [P] Add failing test `tests/unit/data-grid-apply-text-filter.test.tsx` verifying applying a text filter reduces visible rows (simulate entering value in filter control inside sidebar).
- [ ] T006 [P] Add failing test `tests/unit/data-grid-multi-filter-and.test.tsx` verifying combining two filters narrows results with AND logic.
- [ ] T007 [P] Add failing test `tests/unit/data-grid-hide-show-persistence.test.tsx` verifying closing sidebar and reopening preserves previously entered filter values.
- [ ] T008 [P] Add failing test `tests/unit/data-grid-clear-filters.test.tsx` verifying a "Clear Filters" action resets table to original row count and empties filter inputs.
- [ ] T009 [P] Add failing test `tests/unit/data-grid-persist-key.test.tsx` simulating persistence (mock localStorage) returning prior filter state when `persistKey` provided.
- [ ] T010 [P] Add failing test `tests/unit/data-grid-mobile-behavior.test.tsx` (temporarily skipped) with placeholder asserting mobile overlay behavior once clarified. Mark with TODO: clarification required.
- [ ] T011 Add accessibility test `tests/unit/data-grid-a11y-roles.test.tsx` ensuring sidebar has appropriate ARIA labeling, toggle button has `aria-expanded`, focus cycles correctly.

## Phase 3.3: Core Implementation
- [ ] T012 Implement prop surface in `components/data-grid.tsx` (no UI yet): extend interface with optional `enableFilterSidebar`, `onFiltersChange`, `initialFilters`, `persistKey`. Export internal type `FilterDescriptor` in new file `components/data-grid-filters/types.ts`.
- [ ] T013 [P] Implement minimal sidebar toggle UI (`Filters` button + empty sidebar container) using Radix `Sheet` or custom panel; satisfy T004.
- [ ] T014 [P] Add basic text filter control generation: infer text-capable columns (string values) and render input fields bound to react-table `columnFilters`; satisfy T005.
- [ ] T015 [P] Implement multi-filter AND logic (leveraging existing react-table filtering state) and ensure row recalculation; satisfy T006.
- [ ] T016 [P] Implement persistence module `components/data-grid-filters/persistence.ts` (read/write JSON to localStorage using `persistKey`). Wire into mount/unmount; satisfy T009.
- [ ] T017 Add "Clear Filters" button/action inside sidebar; resets column & global filters; satisfy T008.
- [ ] T018 Add hide/show preservation (internal state separation from react-table immediate state); satisfy T007.
- [ ] T019 Add `onFiltersChange` callback invocation debounced (150ms) when filters change.
- [ ] T020 Implement accessibility features: ARIA roles (`role="complementary"`, `aria-label="Filters"`), focus trap, ESC close; satisfy T011.
- [ ] T021 Implement tentative mobile behavior (overlay) with a TODO comment referencing spec clarification (fulfills base of T010 - leave test unskipped once clarified).

## Phase 3.4: Integration & Refinement
- [x] T022 Update existing feature grid usages (search for `DataGrid<`) to optionally pass `enableFilterSidebar` in one pilot page (choose allocations) for manual validation; DO NOT enable globally yet. (Enabled on allocations table only.)
- [x] T023 Create developer documentation `/specs/001-upgrade-data-grid/quickstart.md` describing enabling and configuring sidebar.
- [x] T024 Add performance measurement harness test `tests/unit/data-grid-filter-performance.test.tsx` (measure render count and timing with 1k mock rows; assert under threshold or snapshot counts).
- [x] T025 Add edge case test for empty dataset `tests/unit/data-grid-empty.test.tsx` ensuring sidebar still opens and controls disabled/hidden appropriately.
- [x] T026 Add test for non-string column type ignoring text filter generation `tests/unit/data-grid-non-string-columns.test.tsx`.
- [x] T027 Add documentation comment blocks (TSDoc) for new props in `components/data-grid.tsx`.

## Phase 3.5: Polish
- [x] T028 Refactor duplication: extract reusable hook `usePersistedFilters` to `components/data-grid-filters/usePersistedFilters.ts` if persistence logic exceeds 40 lines.
- [x] T029 [P] Add unit tests for persistence hook `tests/unit/use-persisted-filters.test.ts`.
- [x] T030 [P] Add unit tests for filter descriptor utilities `tests/unit/filter-descriptor-utils.test.ts`.
- [x] T031 Replace temporary TODO mobile logic with finalized behavior (after clarification) and unskip T010.
- [x] T032 Final accessibility audit adjustments (tab order, aria-live announcement on row count change?).
- [x] T033 Update README or internal docs referencing advanced table filtering capability.
- [x] T034 Run Biome + fix, ensure all tests pass, verify tree-shaking (no unused exports).

## Dependencies
- T001 precedes all modification tasks (baseline capture).
- T004-T011 (tests) must FAIL before implementing T012+.
- T012 required before T013-T021.
- T016 depends on T012 (props) and local design of persistence.
- T019 depends on filter controls (T014/T015).
- T021 depends on T013 base UI.
- T022 after core implementation (T013-T021) passes tests.
- Polish tasks (T028+) after integration tasks complete.

## Parallel Execution Guidance
Initial parallel test batch after T001:
```
T005, T006, T008, T009, T010 (skipped), T011 can run in parallel with T004 once file scaffolds differ.
```
Core implementation parallel batch example:
```
T013, T014, T015, T016, T017 can proceed together after T012 (watch for merge conflicts in data-grid.tsx; coordinate small sequential merges if necessary).
```
Polish parallel batch:
```
T029, T030 can run with T028 only after hook extraction is stable.
```

## Validation Checklist
- [x] All new props covered by at least one test
- [x] Filters work with multiple columns (AND)
- [x] Sidebar toggle accessible & keyboard operable
- [x] State persists via `persistKey`
- [x] Clear filters restores baseline row count
- [x] Mobile behavior clarified & implemented
- [x] Performance within target (<150ms perceived apply)
- [x] Documentation updated

## Notes
- Keep changes backward compatible: all new props optional.
- Avoid premature optimization; measure before refactor (T024).
- Revisit persistence scope once clarification provided.
