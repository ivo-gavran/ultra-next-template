# Ultra Next Template

A production-minded Next.js frontend starter with a typed external API boundary.

The goal is simple: clone it and start on product UI. Routing, query state, validated API responses, forms, themes, translations, component documentation, tests and CI are already connected without prescribing a backend, database or authentication provider.

## What is included

| Area                 | Stack                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| Framework            | Next.js 16 App Router, React 19 and strict TypeScript                       |
| API integration      | Typed Axios client, strict Zod validation and auth-ready request hooks      |
| Data fetching        | TanStack Query with reusable keys, pagination and optimistic-update helpers |
| Development API      | MSW browser mocks that keep the template runnable without a backend         |
| Forms                | React Hook Form and shared Zod schemas                                      |
| UI                   | shadcn/ui (Radix), Tailwind CSS v4, semantic design tokens and dark mode    |
| Internationalization | `next-intl`, locale-prefixed routing, English and Bosnian                   |
| Quality              | ESLint, Prettier, Vitest, Playwright, Storybook and accessibility checks    |
| Performance          | Core Web Vitals reporting, bundle analysis and Lighthouse CI budgets        |
| Security             | CSP, secure response headers and automated dependency auditing              |
| Workflow             | pnpm, Lefthook, Commitlint, Dependabot and GitHub Actions                   |

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

Feature API functions use the shared `apiClient`. It resolves relative paths against `NEXT_PUBLIC_API_URL`, supports path and query parameters, rejects transport and HTTP failures with a structured `AppError`, and strictly validates successful JSON with the supplied Zod schema.

```ts
return apiClient.get("/projects/:id", {
  pathParams: { id },
  query: { include: "members" },
  schema: projectResponseSchema,
  signal,
});
```

The example expects one of two envelopes:

```ts
{ data: T }
{ error: { code: string; message: string; details?: unknown } }
```

The default client has a 15-second timeout and supports empty `204` responses. TanStack Query passes its `AbortSignal` through feature API functions, so canceled queries also cancel their network requests.

Create another client when the application needs cookies, dynamic headers or token authentication:

```ts
const authenticatedApi = createApiClient({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  getHeaders: () => ({ "X-App-Version": appVersion }),
  auth: {
    getAccessToken,
    refreshSession,
    onUnauthorized,
  },
});
```

Only one `refreshSession` call runs when concurrent requests receive `401`; waiting requests retry once with the latest token. Use `skipAuth` for public endpoints and `skipAuthRefresh` for auth endpoints that must never enter the refresh flow. The hooks intentionally do not prescribe an authentication provider or token storage mechanism.

Adapt the error-envelope parsing in `src/lib/api/client.ts` if your backend uses a different contract.

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
        queryFn: async ({ signal }) => (await getProjects({ signal })).data,
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

App Router failures use application-owned fallbacks. Localized route errors provide retry actions and optional error references, unknown URLs render a locale-aware 404, and the Projects route has an accessible streaming loading state.

## Observability

Unexpected API, query, mutation, route-boundary and server-rendering failures flow through the provider-neutral `reportAppError` pipeline. Expected operational failures such as cancellation, validation, unauthorized, forbidden and not-found responses stay out of error reporting unless they unexpectedly reach an error boundary.

`src/instrumentation.ts` uses the native Next.js `onRequestError` hook for server failures. Client error boundaries and TanStack Query use the same contract. The same error object is reported only once when it passes through multiple layers.

Configure a production provider once in its client and server instrumentation entry points:

```ts
configureErrorReporter({
  captureException({ error, context, timestamp }) {
    monitoring.captureException(error, { context, timestamp });
  },
});
```

Until an adapter is configured, reports use a console reporter that remains useful in local development and platform logs.

The pipeline creates a safe error copy without Axios causes or application details, redacts metadata keys such as tokens, cookies, passwords and API keys, handles circular metadata, and contains reporter failures. Request headers, bodies, query values and concrete request URLs are never added automatically.

Set `meta: { suppressErrorReport: true }` on an intentionally handled TanStack query or mutation when it should not reach the reporter. This is separate from `suppressErrorToast`.

## Security baseline

Every route receives a Content Security Policy and defensive browser headers. The policy permits the configured `NEXT_PUBLIC_API_URL` origin for browser requests, disables framing and object embedding, limits powerful browser features, removes the `X-Powered-By` header, and enables HSTS plus insecure-request upgrades in production.

The default CSP intentionally uses `unsafe-inline` for Next.js scripts and styles so the policy does not itself force routes into dynamic rendering. A nonce-based strict CSP requires dynamic rendering in Next.js. If a product already renders every request dynamically and needs that stronger tradeoff, migrate the policy to nonces in `proxy.ts` using the current Next.js CSP guide.

Add explicit CSP sources when integrating analytics, remote images, WebSockets or an external authentication provider. Cross-Origin-Opener-Policy is intentionally not enabled because it can break OAuth popup flows. Do not add secrets to `NEXT_PUBLIC_*` variables; Next.js embeds them in the client bundle.

Dependabot checks npm packages and GitHub Actions weekly. CI audits the installed production dependency tree and fails when the package registry reports a known high or critical vulnerability. Registry availability does not make the quality pipeline fail. Enable GitHub's dependency graph and Dependabot security updates in the repository settings for additional alerts and automated security-fix pull requests.

## Accessibility

The application shell provides a localized skip link that moves keyboard focus directly to the main content. Form validation connects invalid controls to announced error messages, while loading states and notifications use appropriate live-region semantics.

Playwright runs axe against the home, Projects and not-found routes across both locales and light and dark themes. Serious and critical WCAG A/AA violations fail the E2E job. Automated checks do not replace manual keyboard and screen-reader testing; they keep common regressions from reaching review unnoticed.

## Performance

The isolated `WebVitals` client component forwards Next.js Core Web Vitals through a provider-neutral adapter. The default development adapter logs reports to the browser console; production is a no-op until the application configures its analytics provider in `src/instrumentation-client.ts`:

```ts
import { configurePerformanceReporter } from "@/lib/performance/reporting";

configurePerformanceReporter({
  reportWebVital({ metric, timestamp }) {
    analytics.capture("web_vital", { ...metric, timestamp });
  },
});
```

Reports contain only the metric values and timestamp. Performance entries and concrete URLs are not copied automatically; normalize route names explicitly in a provider adapter if the application needs per-route distributions.

`pnpm analyze` opens the native Next.js 16 Turbopack analyzer. Use `pnpm analyze:output` to write a shareable report under `.next/diagnostics/analyze`.

`pnpm performance:check` builds the production application and runs Lighthouse three times against the home and Projects routes using the pinned Playwright Chromium. CI blocks regressions in script and total transfer size, total blocking time, and cumulative layout shift. LCP and the aggregate performance score are warnings because they are more sensitive to runner variance. Reports remain on the local filesystem and are uploaded as private CI artifacts only when the job fails.

## Commands

| Command                   | Purpose                                |
| ------------------------- | -------------------------------------- |
| `pnpm dev`                | Start the development server           |
| `pnpm build`              | Create a production build              |
| `pnpm analyze`            | Open the Next.js bundle analyzer       |
| `pnpm analyze:output`     | Write a static bundle analysis         |
| `pnpm audit:dependencies` | Audit production dependencies          |
| `pnpm lint`               | Run ESLint with zero warnings allowed  |
| `pnpm typegen`            | Generate Next.js and message types     |
| `pnpm typecheck`          | Run strict TypeScript checks           |
| `pnpm test`               | Run the Vitest suite once              |
| `pnpm test:coverage`      | Generate test coverage                 |
| `pnpm test:e2e`           | Run Playwright browser tests           |
| `pnpm test:e2e:a11y`      | Run browser accessibility checks       |
| `pnpm test:e2e:ui`        | Open Playwright's interactive runner   |
| `pnpm performance:check`  | Enforce Lighthouse performance budgets |
| `pnpm storybook`          | Start Storybook on port 6006           |
| `pnpm build-storybook`    | Build static Storybook output          |
| `pnpm format`             | Format the repository                  |

## End-to-end tests

Install Chromium once, then run the suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts Next.js on port `3100` with the external API contract mocked in the browser. Tests cover locale routing, localized 404 handling, project CRUD, keyboard navigation and WCAG regression scans without Docker, a database or a live backend. Failure traces, screenshots and videos are written to ignored local report directories; CI uploads them only when the E2E job fails.

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
