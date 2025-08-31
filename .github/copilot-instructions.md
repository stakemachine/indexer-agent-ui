## AI Agent Instructions

This guide provides essential, project-specific instructions for AI coding agents to be productive and make safe, high-quality changes.

### Core Architecture & Data Flow

This is a Next.js application using the **App Router**. The primary function is to provide a UI for an **Indexer Agent**, which manages operations on The Graph Network.

1.  **Backend Communication**: The UI does **not** talk directly to the Indexer Agent or the network subgraph. Instead, it uses its own API routes as proxies:

    - `/api/agent`: This route handler forwards GraphQL requests to the `AGENT_ENDPOINT` defined in `lib/env.ts`.
    - `/api/subgraph/[network]`: This dynamic route handler forwards GraphQL requests to the appropriate network subgraph, using the `AGENT_NETWORK_ENDPOINT` from `lib/env.ts`.
    - **Key File**: `app/api/subgraph/[network]/route.ts` shows this proxy pattern.

2.  **Data Fetching (Client-side)**: We use **SWR** for all client-side data fetching.

    - **SWR Keys**: Keys **must** be tuples, typically `[query, variables]`. Example: `useSWR([MY_QUERY, { protocolNetwork }], tupleFetcher)`.
    - **Fetcher**: The global fetcher is `tupleFetcher` from `lib/graphql/client.ts`. It inspects the variables to decide whether to call the agent or subgraph proxy endpoint.
    - **Global State**: Global client state is managed with **Zustand**. See `lib/store.ts` for `useNetworkStore` (the currently selected network) and `useIndexerRegistrationStore`.

3.  **Component Structure**:
    - **`app/`**: Contains all pages (routes). These are primarily Server Components.
    - **`components/`**: Contains reusable UI components.
      - `components/ui/`: Base components from `shadcn/ui`.
      - `components/dashboard/`, `components/allocations/`, etc.: Feature-specific components that compose UI and data fetching hooks. These are often Client Components (`'use client'`).
    - **`lib/`**: Core logic, utilities, and configurations.
      - `lib/graphql/`: Contains GraphQL client, queries, and Zod schemas.
      - `lib/env.ts`: **Crucially**, all environment variable access goes through this file. It uses lazy getters to avoid build-time errors.

### Developer Workflow

- **Setup**: Run `pnpm install`.
- **Development**: Run `pnpm dev`. This starts the Next.js dev server.
- **Linting/Formatting**: This project uses **Biome**. Do not add Prettier or ESLint.
  - `pnpm biome:check`: Check for issues.
  - `pnpm biome:fix`: Automatically fix issues.
- **Testing**: This project uses **Vitest**.
  - `pnpm test`: Run tests in the console.
  - `pnpm test:ui`: Run tests in the browser with the Vitest UI.
  - Test files are located in the same directory as the source file, with a `.test.ts` or `.test.tsx` extension (e.g., `lib/utils.test.ts`).
  - **Key File**: `vitest.config.ts` defines the test environment and aliases.

### Key Project Conventions

- **Environment Variables**: **Never** access `process.env` directly in components. Always import from `lib/env.ts`. This is critical for how the app is built and deployed.
- **Server vs. Client Components**: Default to Server Components. When client-side interactivity is needed (e.g., hooks like `useState`, `useEffect`, `useSWR`), create a dedicated Client Component (`'use client'`) and import it into the Server Component.
- **Styling**: Use **Tailwind CSS** and `shadcn/ui` components. Utility classes are preferred.
- **Authentication**: Handled by `next-auth`. The `withAuth` middleware in `middleware.ts` protects routes. Client session data is available via the `useSession` hook.

### How to Add a New Feature (Example: New Page)

1.  Create a new folder under `app/`, for example `app/new-feature/`.
2.  Create `app/new-feature/page.tsx`. This will be a Server Component by default.
3.  If you need to fetch data and display it, create a Client Component like `components/new-feature/new-feature-view.tsx`.
4.  Inside `new-feature-view.tsx`, use the `useSWR` hook with the `tupleFetcher` to get your data.
5.  Define any new GraphQL queries in `lib/graphql/queries.tsx`.
6.  Import `<NewFeatureView />` into `app/new-feature/page.tsx`.
7.  Add a link to the new page in `components/header.tsx`.
