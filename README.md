# Ultra Next Template

A production-minded Next.js frontend starter with a typed external API boundary.

The goal is simple: clone it and start on product UI. Routing, query state, validated API responses, forms, themes, translations, component documentation, tests and CI are already connected without prescribing a backend, database or authentication provider.

## What is included

| Area                 | Stack                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| Framework            | Next.js 16 App Router, React 19 and strict TypeScript                       |
| API integration      | Typed `fetch`, runtime Zod validation and an environment-based API URL      |
| Data fetching        | TanStack Query with reusable keys, pagination and optimistic-update helpers |
| Development API      | MSW browser mocks that keep the template runnable without a backend         |
| Forms                | React Hook Form and shared Zod schemas                                      |
| UI                   | shadcn/ui (Radix), Tailwind CSS v4, semantic design tokens and dark mode    |
| Internationalization | `next-intl`, locale-prefixed routing, English and Bosnian                   |
| Quality              | ESLint, Prettier, Vitest, Playwright, Storybook and accessibility checks    |
| Workflow             | pnpm, Lefthook, Commitlint and GitHub Actions                               |

The Projects page demonstrates the complete frontend path from a validated form through a TanStack Query mutation to a typed external REST contract. Development and E2E use the same contract through MSW; production points it at your API.

## Quick start

Requirements: Node.js 24+ and pnpm 11+.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The development mock is enabled by default, so the Projects demo works without any additional service.

## Project structure

```text
src/
├── app/                    # Localized App Router pages and route fallbacks
├── components/
│   ├── layout/             # Header, locale and theme controls
│   ├── projects/           # Example feature UI
│   ├── providers/          # Query, theme, toast and mock providers
│   └── ui/                 # Reusable design-system primitives
├── config/                 # Validated public environment
├── features/               # API functions, schemas and query hooks
├── i18n/                   # Routing, navigation and request config
├── lib/                    # API, errors, queries, validation and utilities
├── mocks/                  # Development API contract handlers
└── test/                   # Shared unit-test setup
```

Application composition stays thin, features own their schemas and data operations, reusable UI stays independent, and backend-specific decisions stay outside the template.

UI primitives are source-owned shadcn/ui components configured through `components.json`. Storybook documents customized primitives, theme foundations and feature-level states instead of duplicating the complete shadcn catalog.

## External API contract

Configure the backend URL at build time:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_MOCKING=disabled
```

Feature API functions pass relative paths to `apiRequest`. The client resolves them against `NEXT_PUBLIC_API_URL`, rejects non-success responses with a structured `AppError`, and validates successful JSON at runtime with the supplied Zod schema.

The example expects one of two envelopes:

```ts
{ data: T }
{ error: { code: string; message: string; details?: unknown } }
```

Adapt `src/lib/api/client.ts` if your backend uses a different envelope, authentication header or credential strategy. Authentication is intentionally not bundled: connect the session or token mechanism owned by your actual backend or identity provider.

`NEXT_PUBLIC_*` values are embedded into the browser bundle during `next build`. Set them in the build environment, not only when starting the server.

## Development mocks

With `NEXT_PUBLIC_API_MOCKING=enabled`, `ApiMockProvider` starts the MSW service worker before rendering query consumers. Handlers in `src/mocks/handlers.ts` implement the same schemas and URLs as the real feature API.

Mocks are for local development and browser tests. Production builds should use:

```bash
NEXT_PUBLIC_API_MOCKING=disabled
```

When the contract changes, update the feature schema, API function and mock handler together. Runtime parsing then catches backend drift before malformed data reaches the UI.

## Query conventions

Each feature owns a cache contract built with `createEntityQueryFactory`:

```ts
const projectQueryFactory = createEntityQueryFactory("projects");

export const projectKeys = projectQueryFactory.keys;

export const projectQueries = {
  list: () =>
    projectQueryFactory.list(
      {},
      {
        queryFn: async () => (await getProjects()).data,
      },
    ),
};
```

Consumers continue to use the native TanStack API:

```ts
const projects = useQuery(projectQueries.list());
await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
```

The factory standardizes the key hierarchy for finite lists, infinite lists and details while returning native `queryOptions` and `infiniteQueryOptions` objects. Pagination helpers and optimistic updates with rollback live in `src/lib/query`. Loading, error/retry and empty states use shared accessible UI primitives.

TanStack Query DevTools are mounted automatically in development and render nothing in production.

## Error and route resilience

Stable external error codes map to localized user messages instead of displaying backend copy directly. Query and mutation failures flow through the shared toast provider, while features can suppress the global notification when they render an inline retry state.

App Router failures use application-owned fallbacks. Localized route errors provide retry actions and optional error references, unknown URLs render a locale-aware 404, and the Projects route has an accessible streaming loading state. Unexpected route errors pass through `reportAppError`, the integration point for a production reporting service.

## Commands

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `pnpm dev`             | Start the development server          |
| `pnpm build`           | Create a production build             |
| `pnpm lint`            | Run ESLint with zero warnings allowed |
| `pnpm typegen`         | Generate Next.js and message types    |
| `pnpm typecheck`       | Run strict TypeScript checks          |
| `pnpm test`            | Run the Vitest suite once             |
| `pnpm test:coverage`   | Generate test coverage                |
| `pnpm test:e2e`        | Run Playwright browser tests          |
| `pnpm test:e2e:ui`     | Open Playwright's interactive runner  |
| `pnpm storybook`       | Start Storybook on port 6006          |
| `pnpm build-storybook` | Build static Storybook output         |
| `pnpm format`          | Format the repository                 |

## End-to-end tests

Install Chromium once, then run the suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts Next.js on port `3100` with the external API contract mocked in the browser. Tests cover locale routing, localized 404 handling and project CRUD without Docker, a database or a live backend. Failure traces, screenshots and videos are written to ignored local report directories; CI uploads them only when the E2E job fails.

## Adding a locale

1. Add the locale to `src/i18n/routing.ts`.
2. Copy a complete message file into `messages/<locale>.json`.
3. Update the locale switcher if you want more than the included two-language toggle.
4. Run `pnpm typecheck` and `pnpm test` to verify message keys and ICU arguments against the English source locale.

`next-intl` derives namespaces, message keys, interpolation arguments and supported locale types from `messages/en.json` and `src/i18n/routing.ts`. English is the canonical message schema; every locale must preserve the same key tree and argument names.

## CI and deployment

GitHub Actions verifies formatting, linting, types, unit tests, Storybook, the production build and browser-level E2E tests. Lefthook runs fast static checks before a commit, while Commitlint enforces Conventional Commits.

Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_MOCKING=disabled` in the production build environment, then deploy to any Node.js-compatible Next.js host. Configure CORS and the chosen authentication mechanism on the external backend for the deployed frontend origin.

## License

MIT
