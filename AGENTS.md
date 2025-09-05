# AGENTS.md — Productive Guide for AI Coding Agents

This repository is a Next.js App Router application that provides a UI for managing a Graph Indexer Agent. This guide equips AI coding agents (and humans) to make safe, high‑quality, minimal changes quickly and confidently.

If in doubt, prefer small, focused diffs, leverage the existing patterns, and validate changes with Biome and Vitest.

## TL;DR for Agents

- Data flow: Client components use SWR with tuple keys → local API routes → upstream GraphQL.
- Never call upstream endpoints directly from components. Use the app’s API proxies at `/api/agent` or `/api/subgraph/[network]`.
- Never read server env vars in components. Import from `lib/env.ts` (server). Client can use `NEXT_PUBLIC_*` vars only.
- Use existing GraphQL queries in `lib/graphql/queries.tsx`; add new queries there.
- Validate GraphQL data with Zod schemas from `lib/graphql/schemas.ts` (or follow current patterns when present).
- Styling uses Tailwind + shadcn/ui. Keep Server Components by default; add `'use client'` only when needed.
- Lint/format via Biome; tests via Vitest. Keep changes minimal and consistent with surrounding code.

---

## Architecture & Data Flow

- Next.js App Router (`app/`), default Server Components; Client Components when interactivity is required.
- Client state: Zustand stores in `lib/store.ts` (e.g., selected `currentNetwork`).
- Data fetching: SWR everywhere in Client Components.
  - Tuple keys are mandatory when routing GraphQL: `[QUERY, { protocolNetwork }]` or `[QUERY, { network }]`.
  - `tupleFetcher` in `lib/graphql/client.ts` chooses the right proxy (`/api/agent` vs `/api/subgraph/[network]`) based on the key’s vars.
- API proxies (server‑side):
  - `app/api/agent/route.ts` forwards GraphQL to `env.AGENT_ENDPOINT`.
  - `app/api/subgraph/[network]/route.ts` forwards GraphQL to `buildNetworkSubgraphEndpoint(network)` using `env.AGENT_NETWORK_ENDPOINT`.
  - Input is validated, errors are normalized, responses are returned as JSON.
- Auth: `next-auth` Credentials provider. Middleware protects routes (`middleware.ts`). Sign‑in page at `app/signin/page.tsx`.

Key references:

- GraphQL client and fetchers: `lib/graphql/client.ts`, `lib/fetchers.ts`
- GraphQL queries: `lib/graphql/queries.tsx`
- Zod schemas: `lib/graphql/schemas.ts`
- Environment & endpoints: `lib/env.ts`
- Global SWR config and error handling: `components/swr-provider.tsx`

---

## Environment & Configuration

All server environment variables are read via `lib/env.ts` using lazy getters:

- Required: `AGENT_ENDPOINT`, `AGENT_NETWORK_ENDPOINT`, `UI_LOGIN`, `UI_PASS`
- Optional: `ARBITRUM_RPC_URL`

Production notes:

- `NEXTAUTH_SECRET` is required; set `NEXTAUTH_URL` when the public URL differs from the container port.
- `NEXT_PUBLIC_APP_VERSION` is auto‑injected from `package.json` in `next.config.js` and used for update hints in the header.
- `NEXT_PUBLIC_GITHUB_REPO` may be set to customize the repo link used by the header update indicator (defaults to `stakemachine/indexer-agent-ui`).

Run locally:

```bash
pnpm install
pnpm dev
```

Run in Docker (see README for details):

```bash
docker run -p 3000:3000 -d --network=<indexer-network> \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e UI_LOGIN=<username> -e UI_PASS=<SecurePassword> \
  -e AGENT_ENDPOINT=http://indexer-agent:8000 \
  -e AGENT_NETWORK_ENDPOINT=https://gateway.thegraph.com/network \
  ghcr.io/stakemachine/indexer-agent-ui:latest
```

---

## Fetching Data Correctly

Prefer the established patterns below to keep routing, caching, and error handling consistent.

1) Use the tuple fetcher when a variable indicates the network:

```tsx
import useSWR from "swr";
import { tupleFetcher } from "@/lib/graphql/client";
import { AGENT_STATUS_QUERY } from "@/lib/graphql/queries";

const { data, error } = useSWR([AGENT_STATUS_QUERY, { protocolNetwork }], tupleFetcher);
```

2) Or build a schema‑validated fetcher bound to a specific endpoint:

```tsx
import useSWR from "swr";
import { createSchemaFetcher } from "@/lib/fetchers";
import { AGENT_INDEXER_DEPLOYMENTS_QUERY } from "@/lib/graphql/queries";
import { IndexerDeploymentsResponseSchema } from "@/lib/graphql/schemas";

const fetcher = createSchemaFetcher({ endpoint: "/api/agent", schema: IndexerDeploymentsResponseSchema });
const { data } = useSWR([AGENT_INDEXER_DEPLOYMENTS_QUERY, { protocolNetwork }], ([q, v]) => fetcher(q as string, v as object));
```

3) When you just need the raw client for the current network:

```ts
import { agentClient, subgraphClient } from "@/lib/graphql/client";

agentClient().request(MY_MUTATION, vars);
subgraphClient(network).request(MY_QUERY, vars);
```

Do:

- Add new queries to `lib/graphql/queries.tsx`.
- Add/extend Zod schemas in `lib/graphql/schemas.ts` and use them via `createSchemaFetcher` where applicable.
- Use tuple keys in SWR when your variables affect the endpoint selection.

Don’t:

- Don’t fetch upstream Graph endpoints directly from components.
- Don’t access `process.env` in components for server secrets; use `lib/env.ts` only on the server. For client, only `NEXT_PUBLIC_*` is allowed.

---

## UI, State, and Styling

- Use Server Components by default. Create a Client Component only if you need hooks, browser APIs, or interactivity, and add `'use client'` at the top.
- Global providers live in `components/app-providers.tsx` (Theme, Session, SWR, header, registration loader).
- Global UI components come from `components/ui/` (shadcn/ui). Compose feature UIs in folders like `components/dashboard`, `components/allocations`, etc.
- Global state: `useNetworkStore` and `useIndexerRegistrationStore` in `lib/store.ts`.
- Tailwind + `cn` helper from `lib/utils.ts` for class composition. Keep utility‑first styles, minimize custom CSS.

---

## Adding a Feature (Playbook)

Example: Add a new page pulling data from the agent.

1) Create a Server Component page: `app/my-feature/page.tsx` that imports a Client Component.
2) Create `components/my-feature/my-feature.tsx` with `'use client'`.
3) Add a GraphQL query to `lib/graphql/queries.tsx` and a schema (if needed) to `lib/graphql/schemas.ts`.
4) Fetch data with SWR using either `tupleFetcher` or a schema fetcher bound to `/api/agent`.
5) Add a menu link in `components/header.tsx`.
6) Validate locally: `pnpm biome:check && pnpm test && pnpm dev`.

Keep the diff surgical: reuse `DataGrid`, shadcn components, and existing helpers when possible.

---

## Networks & Endpoints

- Supported networks: `lib/networks.ts` (`NETWORKS` list). `id` must match the protocol network identifier expected by the agent/subgraph.
- To add a new network, add an entry to `NETWORKS` with `id`, `label`, and optional CAIP‑2 identifier (`caip2`). If the network needs an RPC URL for rewards, wire it in here.
- Subgraph endpoint resolution is centralized in `buildNetworkSubgraphEndpoint()` (enforces simple allowlist for `network`).

---

## Testing & Quality

- Tests: Vitest. Co‑locate tests with sources, e.g., `*.test.ts(x)` next to the code.
  - Commands: `pnpm test` (CLI) or `pnpm test:ui` (browser UI).
- Lint/format: Biome.
  - Commands: `pnpm biome:check` and `pnpm biome:fix`.
  - Pre‑commit hook runs Biome via `lefthook.yml`.
- TypeScript strictness and typed routes are enabled. Use path alias `@/*` from `tsconfig.json`.

---

## Security & Reliability Guidelines

- Validate inputs forwarded by API routes; never trust client input.
- Keep server secrets on the server. Only `NEXT_PUBLIC_*` may be read in client code.
- Sanitize/validate dynamic route params (e.g., `network` in `/api/subgraph/[network]`). See `lib/env.ts`.
- Normalize and surface meaningful errors. See `components/swr-provider.tsx` for global SWR error handling.
- Don’t log secrets. Keep console noise low; use compact warnings/errors.

---

## Performance Notes

- SWR deduping and throttling are configured globally. Avoid redundant polling or duplicate SWR keys.
- Prefer Server Components for heavy non‑interactive parts.
- Keep client bundles small; export only what’s needed from feature modules.
- Use memoization where needed for derived data in client components.

---

## Common Pitfalls (and Fixes)

- Missing tuple keys: If the request depends on `protocolNetwork`/`network`, ensure the SWR key is a tuple so `tupleFetcher` can route it.
- process.env in client: Only `NEXT_PUBLIC_*` are available. Server‑only envs must not leak to client code.
- Server vs client boundaries: Hooks or browser APIs require a dedicated Client Component with `'use client'`.
- Query/schema drift: When adding fields to queries, extend the Zod schema used for validation or match the existing pattern.
- Middleware rewrites: Do not rewrite API proxy routes; they are fully implemented as route handlers.

---

## Release & Version Hints

- The header shows the current version (`NEXT_PUBLIC_APP_VERSION`) and pings GitHub releases via `hooks/use-latest-release.ts`.
- To point the header to a different repo, set `NEXT_PUBLIC_GITHUB_REPO` accordingly.

---

## Additional Reading

- Repo README for setup and Docker usage.
- `.github/instructions/nextjs.instructions.md` for current Next.js best practices.
- `.github/copilot-instructions.md` for a concise agent‑focused summary specific to this codebase.

When in doubt, mimic the nearest similar component and extend Zod schemas to match any query changes. Keep changes minimal, typed, and validated.

