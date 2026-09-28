# Ultra Next Template

A production-ready Next.js frontend starter for building product interfaces without setting up the same foundations again.

It includes routing, translations, theming, forms, a typed API layer, server-state management, tests, Storybook and CI. It intentionally does not include a backend, database or authentication provider.

## What's included

- Next.js 16 App Router, React 19 and strict TypeScript
- Tailwind CSS v4 and source-owned shadcn/ui components
- Light and dark themes
- English and Bosnian routes with `next-intl`
- Axios API client with Zod response validation
- TanStack Query, TanStack Table and development Query DevTools
- React Hook Form with shared Zod schemas
- MSW browser mocks, so the app works without a backend
- Localized metadata, sitemap, robots and web manifest
- Vitest, Playwright, accessibility and visual regression tests
- Storybook, Lighthouse performance budgets and GitHub Actions
- Secure response headers, dependency audits and generated SVG icons

The Projects page is the reference feature. It demonstrates validated forms, URL-backed search and pagination, a reusable data table, optimistic updates, loading and error states, and a typed REST API contract.

## Requirements

- Node.js 24 or newer
- pnpm 11 or newer
- Docker Desktop only if you want to run the canonical visual tests locally

## Getting started

Create a repository from this template, or clone it directly:

```bash
git clone https://github.com/ivo-gavran/ultra-next-template.git my-app
cd my-app
pnpm install
pnpm setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm setup` asks for the app name, package name, public URLs and default locale. It updates the shared app configuration and creates `.env.local`. To accept all template defaults without prompts, run:

```bash
pnpm setup -- --yes
```

Development API mocking is enabled by default, so the Projects demo works immediately.

## Environment variables

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_MOCKING=enabled
```

| Variable                  | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`     | Public app origin used for canonical URLs and metadata |
| `NEXT_PUBLIC_API_URL`     | Base URL of the external REST API                      |
| `NEXT_PUBLIC_API_MOCKING` | Use `enabled` locally or `disabled` with a real API    |

These values are public and embedded during `next build`. Never store secrets in `NEXT_PUBLIC_*` variables.

## Project structure

```text
src/
├── app/                 # Localized App Router pages and route fallbacks
├── components/
│   ├── icons/           # Generated SVG React components
│   ├── layout/          # Application shell and controls
│   ├── providers/       # Query, theme, toast and mock providers
│   └── ui/              # Reusable UI primitives
├── config/              # App identity and public environment config
├── features/            # Colocated feature UI, schemas and data operations
├── i18n/                # Locale routing and request configuration
├── lib/                 # API, auth, query, error and reporting utilities
└── mocks/               # Development API handlers

messages/                # Translation files
assets/icons/            # Source SVG files
docs/                    # Integration guides
e2e/                     # Browser and visual tests
```

Features own their UI, schemas and data operations. Reusable UI stays independent, and backend-specific decisions remain outside the starter.

## Connecting a real API

Set your API URL and disable mocks:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_MOCKING=disabled
```

The shared API client expects these response envelopes:

```ts
// Success
{ data: T }

// Error
{ error: { code: string; message: string; details?: unknown } }
```

Each feature keeps its UI, Zod schemas, API functions and TanStack Query definitions together. Update the schema, API function and MSW handler together when a contract changes.

Authentication hooks are provider-neutral and support bearer tokens, cookie sessions and a single shared refresh request. See [the authentication guide](docs/authentication.md) before connecting an auth provider.

## Common commands

| Command                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `pnpm setup`               | Personalize the starter and create `.env.local`     |
| `pnpm dev`                 | Start the development server                        |
| `pnpm build`               | Create a production build                           |
| `pnpm lint`                | Run ESLint                                          |
| `pnpm typecheck`           | Generate types and run TypeScript checks            |
| `pnpm test`                | Run unit tests                                      |
| `pnpm test:coverage`       | Run unit tests with coverage gates                  |
| `pnpm test:e2e`            | Run Playwright browser tests                        |
| `pnpm test:e2e:production` | Build and smoke-test the production app without MSW |
| `pnpm test:e2e:a11y`       | Run accessibility checks                            |
| `pnpm test:visual:docker`  | Compare canonical visual snapshots                  |
| `pnpm storybook`           | Start Storybook on port 6006                        |
| `pnpm performance:check`   | Run the production Lighthouse checks                |
| `pnpm analyze`             | Open the Next.js bundle analyzer                    |
| `pnpm icons:generate`      | Generate typed components from `assets/icons`       |
| `pnpm format`              | Format the repository                               |

Install Playwright's browser once before running E2E tests locally:

```bash
pnpm exec playwright install chromium
```

## Customizing the starter

- App identity: edit `src/config/site-config.json` or rerun `pnpm setup`.
- Translations: update `messages/en.json` and `messages/bs.json` together. English is the type-safe source locale.
- UI: edit the source-owned primitives in `src/components/ui` and document meaningful states in Storybook.
- Icons: add SVG files to `assets/icons`, then run `pnpm icons:generate`.
- API behavior: adapt `src/lib/api/client.ts` if your backend uses a different response contract.
- Monitoring: connect your providers in `src/instrumentation.ts` and `src/instrumentation-client.ts`.

Feature queries use TanStack's `queryOptions` directly with shared query keys. Keep API calls and cache invalidation in the feature; introduce additional abstractions only when multiple features need them.

### Removing the Projects demo

Replace the home page in `src/app/[locale]/page.tsx`, then remove `src/app/[locale]/projects` and `src/features/projects`. Remove the Projects navigation link from `src/components/layout/site-header.tsx` and its entry in `publicRoutes` in `src/config/site.ts`. Update both translation files and the route assertions in `src/app/metadata-routes.test.ts` and `e2e/` to match your new routes, along with the URLs in `.lighthouserc.cjs` and the feature paths in `vitest.config.ts`.

Replace the demo handlers in `src/mocks/handlers.ts` with your API's handlers, or remove `ApiMockProvider` from `AppProviders` and remove `src/mocks` if you no longer need browser mocks. Set `NEXT_PUBLIC_API_MOCKING=disabled` when connecting your backend. Keep the shared UI, API client and query utilities for your own features.

## CI and deployment

GitHub Actions verifies formatting, linting, types, generated icons, unit coverage, Storybook, production builds, E2E tests, accessibility, visual snapshots, performance budgets and dependency security.

The production smoke suite builds and starts the app on port 3150 with MSW disabled. It checks server-rendered content without JavaScript, hydration, API data loading, locale navigation and metadata. Playwright supplies deterministic external API responses for the data-loading test; it does not require a running backend. Run build-based suites sequentially because they share `.next` output.

For production, set these variables in the build environment:

```bash
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_MOCKING=disabled
```

Then deploy the production build to any Node.js-compatible Next.js host. Configure CORS and authentication on the external backend for your frontend origin.

## License

MIT
