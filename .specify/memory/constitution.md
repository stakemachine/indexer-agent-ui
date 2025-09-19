<!--
Sync Impact Report
- Version change: 2.1.1 → 3.0.0
- Modified principles: Replaced example placeholders with project-specific principles
	→ I. Code Quality (NON-NEGOTIABLE)
	→ II. Testing Standards
	→ III. User Experience Consistency
	→ IV. Performance Requirements
- Added sections: "Additional Constraints: Security & Reliability", "Development Workflow & Quality Gates"
- Removed sections: None (template placeholders replaced)
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (Constitution Check updated)
	✅ .specify/templates/spec-template.md (Non-Functional Requirements added)
	✅ .specify/templates/tasks-template.md (Quality gates and validation updated)
	⚠ .specify/templates/commands/* (not present in repo) — no action
- Follow-up TODOs: TODO(RATIFICATION_DATE)
-->

# Indexer Agent UI Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)
- The codebase MUST use TypeScript in strict mode. Avoid `any` and untyped external data.
- Lint/format with Biome MUST be clean before merge (`pnpm biome:check`).
- Respect Next.js App Router boundaries: default Server Components; use Client Components only
	when interactivity or browser APIs are required. Never use `next/dynamic` with `{ ssr: false }`
	inside Server Components.
- Environment variables MUST be accessed via `lib/env.ts` on the server. Client code may only
	read `NEXT_PUBLIC_*` variables. Never read `process.env` directly in components.
- Follow repository conventions: path alias `@/*`, shadcn/ui components, Tailwind utilities,
	consistent naming (PascalCase components, camelCase functions, UPPER_SNAKE_CASE constants).
- Keep diffs small and focused. Prefer composition over duplication. Add comments where intent
	is non-obvious. Avoid unnecessary dependencies and bundle bloat.

Rationale: High quality and consistent code reduces defects, eases onboarding, and enables rapid,
safe iteration in a security-sensitive, networked environment.

### II. Testing Standards
- Testing framework: Vitest. Tests co-located with sources using `.test.ts` / `.test.tsx` suffix.
- New features MUST include tests. Bug fixes MUST include a failing test that reproduces the issue.
- Minimum coverage targets (guideline): library/utilities ≥ 85% lines; critical UI logic and hooks
	MUST cover happy path and at least one edge case. Visual regressions optional.
- Write accessibility-minded tests for interactive components (roles/labels/keyboard where applicable).
- API route handlers and GraphQL client utilities SHOULD include schema/shape validation tests
	(Zod where applicable).

Rationale: Tests provide executable specifications, prevent regressions, and document behavior.

### III. User Experience Consistency
- Use shadcn/ui components and Tailwind utilities; avoid bespoke component primitives unless justified.
- Accessibility is mandatory: semantic HTML, focus management, keyboard navigation, ARIA where needed.
- Data fetching MUST use SWR with tuple keys and the provided `tupleFetcher`/clients. Components must
	NOT call upstream Graph endpoints directly—use `/api/agent` and `/api/subgraph/[network]` proxies.
- Adhere to established patterns: URL state via `nuqs` where appropriate, global state via Zustand,
	and table patterns consistent with TanStack Table usage in this repo.
- Maintain consistent layout, spacing, and theming. Avoid surprising interactions.

Rationale: Consistency reduces cognitive load, improves accessibility, and accelerates development.

### IV. Performance Requirements
- Budgets (guidance; enforce in review):
	- First Load JS per route ≤ 300 kB, incremental route chunks ≤ 150 kB.
	- Interactive table/filter operations: median ≤ 100 ms, p95 ≤ 250 ms on typical dev hardware.
	- API proxy p95 latency ≤ 800 ms; avoid N+1 requests; batch or cache where reasonable.
- Keep client bundles lean: prefer Server Components, code-split large clients, avoid heavy deps.
- For tables > 500 rows, use pagination or virtualization; avoid rendering hidden heavy content.
- Use SWR deduping/throttling; memoize derived data; avoid unnecessary re-renders.
- Provide simple perf notes in PRs when features risk budget breaches; include follow-up tasks if needed.

Rationale: Meeting budgets maintains a responsive UI and keeps operational costs predictable.

## Additional Constraints: Security & Reliability
- Validate and sanitize all inputs at API boundaries. Normalize and surface meaningful errors.
- Never log secrets. Keep console noise low; prefer structured, actionable logs where useful.
- Protect routes via `next-auth` middleware. Avoid leaking server-only data to the client.
- Network selection and endpoint resolution must go through centralized helpers in `lib/`.

## Development Workflow & Quality Gates
- Every PR MUST pass: build, typecheck, Biome check, and Vitest tests locally/CI.
- Add/Update tests alongside changes (tests-first preferred; tests-before-merge required).
- Respect server/client boundaries and environment rules noted above.
- Document non-trivial decisions in code comments or spec/plan files under `specs/` when applicable.
- For performance-risk changes, include a short note on expected impact and mitigation.

## Governance
- This constitution supersedes ad-hoc practices. Deviations require explicit, time-boxed exceptions
	documented in the PR description with a remediation issue.
- Amendments occur via PR with:
	- Change summary and rationale
	- Version bump following semantic rules below
	- Template sync verification using the checklist
- Versioning policy for this document (semantic):
	- MAJOR: Replace or remove principles; breaking governance changes
	- MINOR: Add new principle/section, materially expand guidance
	- PATCH: Clarifications, wording, formatting
- Compliance: Reviewers verify adherence during PR review and may request adjustments before merge.

**Version**: 3.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2025-09-19