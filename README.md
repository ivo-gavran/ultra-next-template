# Ultra Next Template

A Next.js frontend starter with a working product example and the foundations needed to build on it: UI, localization, API integration, state management, observability and automated quality checks.

The Projects demo runs against an in-browser mock API by default, so you can explore and change the app before connecting a backend. The starter does not ship a backend, database or authentication provider; its API and auth boundaries are designed for you to connect your own.

## Features

### Application and UI

- **Modern app foundation:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS v4 and responsive layouts.
- **Editable component system:** source-owned shadcn/ui and Radix primitives, including buttons, forms, dialogs, menus, tables, pagination, skeletons, spinners and toast notifications. Storybook documents representative component states.
- **Themes and icons:** light/dark theme toggle, Lucide icons and an SVGR pipeline that turns SVGs in `assets/icons` into typed React components.
- **Localization:** English and Bosnian routes and messages with `next-intl`, a language switcher, locale-aware navigation and date/number formatting. English messages generate typed translation keys.
- **Accessible states:** skip link, labelled controls, semantic tables and status regions, focus-aware dialogs, and reusable loading, empty, error and retry views. Storybook and Playwright include accessibility checks.

### Data and integration

- **Typed environment variables:** public variables are parsed with Zod in `src/config/public-env.ts`. Missing or malformed values fail fast with a clear error, and the rest of the app imports a typed `publicEnv` object instead of reading `process.env` directly.
- **Typed REST client:** Axios methods for GET, POST, PUT, PATCH and DELETE; path/query parameters, request cancellation, Zod response validation and normalized application errors.
- **Provider-neutral auth integration:** hooks for bearer tokens or cookie sessions, coordinated refresh for concurrent `401` responses, one retry per request and an unauthorized callback. Connect your own provider; see [the authentication guide](docs/authentication.md).
- **Server state:** TanStack Query with shared query-key helpers, mutation invalidation, optimistic update/rollback helpers, global error reporting and localized error toasts. Query DevTools are available in development.
- **Forms and tables:** React Hook Form with shared Zod input schemas and localized validation messages; a reusable TanStack Table component with sorting and loading/empty states.
- **Backend-free development:** opt-in MSW browser handlers implement the Projects API contract, including CRUD, search, sorting, pagination and summary data. Mocking is enabled in the provided local environment example.

### Delivery and quality

- **Search and sharing metadata:** localized page titles/descriptions, canonical and alternate-language URLs, Open Graph/Twitter metadata, sitemap, robots rules and a web manifest.
- **Resilience and observability:** route and global error boundaries, API/query/mutation/server error reporting hooks with sensitive metadata redaction, plus a pluggable Web Vitals reporter.
- **Security defaults:** Content Security Policy and other response headers, public environment validation, dependency auditing and weekly Dependabot updates.
- **Automated checks:** ESLint, Prettier, strict typechecking, Vitest unit tests with coverage thresholds, Playwright browser/production/accessibility/visual suites, Storybook accessibility checks and Lighthouse performance budgets.
- **Repository workflow:** GitHub Actions runs quality, browser, visual and performance jobs; Lefthook runs local pre-commit checks and Conventional Commit message validation.

### Projects reference feature

The working Projects page shows how these pieces fit together:

- Dashboard cards for total, recently created, recently updated and documented projects.
- Create, edit and delete flows with validated forms, confirmation dialogs, pending feedback and localized error notifications.
- Search, column sorting and page navigation stored in the URL, so filtered views can be shared or revisited.
- Server-driven pagination, previous-page data during page changes, and optimistic edit/delete updates that roll back on failure.
- Reusable table and loading, empty, error and retry states, with localized labels and dates.

Its feature code lives together in `src/features/projects`: UI, schemas, API functions, URL filters and query definitions.

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

`pnpm setup` asks for the app and package names, short name, public URLs, default locale and English/Bosnian descriptions. It updates the shared app configuration, package metadata, `.env.example`, the README title and `.env.local`. To accept all template defaults without prompts, run:

```bash
pnpm setup -- --yes
```

Use `pnpm setup -- --dry-run` to preview its changes or `pnpm setup -- --help` to see all flags. If setup changes the package name, run `pnpm install` again to refresh the lockfile.

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

Each variable is validated and typed by the Zod schema in `src/config/public-env.ts`. When you add a variable, add it to that schema and read it through `publicEnv`.

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

| Command                          | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `pnpm setup`                     | Personalize the starter and create `.env.local`     |
| `pnpm dev`                       | Start the development server                        |
| `pnpm build`                     | Create a production build                           |
| `pnpm start`                     | Serve the production build                          |
| `pnpm lint`                      | Run ESLint                                          |
| `pnpm typegen`                   | Generate Next.js route types                        |
| `pnpm typecheck`                 | Generate types and run TypeScript checks            |
| `pnpm test`                      | Run unit tests                                      |
| `pnpm test:watch`                | Run unit tests in watch mode                        |
| `pnpm test:coverage`             | Run unit tests with coverage gates                  |
| `pnpm test:e2e`                  | Run Playwright browser tests                        |
| `pnpm test:e2e:production`       | Build and smoke-test the production app without MSW |
| `pnpm test:e2e:a11y`             | Run accessibility checks                            |
| `pnpm test:e2e:ui`               | Open the Playwright test UI                         |
| `pnpm test:e2e:report`           | Open the saved Playwright report                    |
| `pnpm test:visual`               | Run visual tests in a compatible Linux environment  |
| `pnpm test:visual:update`        | Update snapshots in a compatible Linux environment  |
| `pnpm test:visual:docker`        | Compare canonical visual snapshots                  |
| `pnpm test:visual:update:docker` | Update canonical snapshots in Docker                |
| `pnpm storybook`                 | Start Storybook on port 6006                        |
| `pnpm build-storybook`           | Build the static Storybook                          |
| `pnpm performance:check`         | Run the production Lighthouse checks                |
| `pnpm analyze`                   | Open the Next.js bundle analyzer                    |
| `pnpm analyze:output`            | Write bundle analysis output                        |
| `pnpm icons:generate`            | Generate typed components from `assets/icons`       |
| `pnpm icons:check`               | Check that generated icons match their SVG sources  |
| `pnpm audit:dependencies`        | Audit production dependencies                       |
| `pnpm format`                    | Format the repository                               |
| `pnpm format:check`              | Check repository formatting                         |

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
