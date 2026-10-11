# Ultra Next Template

A Next.js frontend starter with a working product example and the foundations needed to build on it: UI, localization, API integration, state management, observability and automated quality checks.

The Projects demo runs against an in-browser mock API by default, so you can explore and change the app before connecting a backend. The starter does not ship a backend, database or authentication provider; its API and auth boundaries are designed for you to connect your own.

## What is included

- Next.js App Router, React, strict TypeScript and Tailwind CSS.
- Source-owned shadcn/ui components, light/dark themes, Lucide icons and Storybook.
- English and Bosnian routes, typed translation keys and locale-aware navigation.
- A typed Axios client with response validation, cancellation and provider-neutral authentication hooks.
- TanStack Query for server state, nuqs for URL filters, and React Hook Form with Zod validation.
- A Projects example with summary cards, create/edit/delete forms, search, sorting, pagination and optimistic updates.
- Browser API mocks, localized metadata, error boundaries, error reporting and Web Vitals hooks.
- Unit, browser, accessibility, visual and performance checks, plus CI and local Git hooks.

The Projects feature lives in `src/features/projects`. Its API functions, filters, queries and schemas sit beside a `components` directory. Shared UI components keep tests and stories adjacent to the component file.

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
│   ├── providers/       # Query, URL state, theme, toast and mock providers
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

| Command                                    | Purpose                                         |
| ------------------------------------------ | ----------------------------------------------- |
| `pnpm setup`                               | Personalize the starter and create `.env.local` |
| `pnpm dev`                                 | Start the development server                    |
| `pnpm build` / `pnpm start`                | Build / serve the production app                |
| `pnpm lint` / `pnpm typecheck`             | Check code and types                            |
| `pnpm format` / `pnpm format:check`        | Format / check formatting                       |
| `pnpm test` / `pnpm test:coverage`         | Run unit tests / coverage gates                 |
| `pnpm test:e2e`                            | Run browser and accessibility tests             |
| `pnpm test:e2e:production`                 | Build and test production with MSW disabled     |
| `pnpm test:visual:docker`                  | Compare canonical visual snapshots              |
| `pnpm test:visual:update:docker`           | Update canonical snapshots                      |
| `pnpm storybook` / `pnpm build-storybook`  | Run / build Storybook                           |
| `pnpm performance:check`                   | Build and run Lighthouse budgets                |
| `pnpm icons:generate` / `pnpm icons:check` | Generate / verify SVG components                |
| `pnpm audit:dependencies`                  | Audit production dependencies                   |

Use `pnpm test:watch` for unit watch mode, `pnpm test:e2e:ui` for the browser test UI, and `pnpm test:e2e:report` for the saved report. Run only accessibility tests with `pnpm test:e2e:a11y`.

`pnpm test:visual` and `pnpm test:visual:update` run visual checks directly in a compatible Linux environment. Docker provides that environment locally.

Use `pnpm analyze` to open the bundle analyzer or `pnpm analyze:output` to save its output. All scripts are defined in `package.json`.

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

Use nuqs for shareable URL state and React state for temporary UI state such as open dialogs. The Projects filter parsers in `src/features/projects/filters.ts` reuse the Zod schemas. Invalid parameters fall back individually to defaults; unrelated parameters are preserved and default values are omitted. Search waits 300 ms before committing, and search/sort changes reset pagination. URL updates replace history without scrolling or server navigation; TanStack Query fetches the matching data.

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
