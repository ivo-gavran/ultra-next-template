# Ultra Next Template

A minimal, domain-agnostic Next.js frontend starter. Configure its identity, start the application, and build your first feature on a reusable foundation.

The home page contains an application shell, a short placeholder, locale switching and light/dark theme controls. It renders without a backend. You choose the application domain, REST contracts, authentication provider and deployment platform; no authentication backend, database or business implementation is included.

## Included infrastructure

- Next.js App Router, React, strict TypeScript and Tailwind CSS.
- Source-owned shadcn/ui primitives, generic TanStack Table components, Lucide and generated SVG icons, and reusable Storybook stories.
- English and Bosnian localization, typed messages, locale-aware navigation and dates, and light/dark themes.
- Generic Axios API client with Zod response validation, cancellation, normalized errors and provider-neutral authentication hooks.
- TanStack Query providers, query keys, pagination and optimistic rollback utilities; nuqs URL state; React Hook Form and Zod validation tooling.
- Typed public environment configuration, localized metadata, canonical and alternate URLs, robots, sitemap and application manifest.
- Shared error boundaries and reporting, Web Vitals reporting, CSP and security headers.
- Vitest coverage gates, Playwright development and production tests, accessibility audits, visual regression and Lighthouse budgets.
- GitHub Actions, Dependabot, Lefthook and a project setup CLI.

MSW remains a test dependency for isolated API-client contract tests. There is no browser mock worker, fake API or mock startup requirement in the application.

## Create a new application

Use Node.js 24 or newer and the pnpm version pinned in `package.json`. Clone into your new application's directory, then configure its identity:

```bash
git clone https://github.com/ivo-gavran/ultra-next-template.git my-app
cd my-app
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The root uses a saved or supported browser locale preference, falling back to the configured default locale.

Point the Git remote at your own repository before pushing application changes.

## Initialize project identity

`pnpm setup` asks for the application name, short name, package name, public URLs, default locale and descriptions in English and Bosnian. It updates `src/config/site-config.json`, `package.json`, `.env.example`, `.env.local` and the README title. The full name appears on the home page and in metadata; the short name appears in the header and manifest.

Preview changes without writing files:

```bash
pnpm setup -- --yes --name "My Application" --short-name "My App" --dry-run
```

Apply a complete noninteractive configuration:

```bash
pnpm setup -- --yes \
  --name "My Application" \
  --short-name "My App" \
  --package-name my-application \
  --app-url https://app.example.com \
  --api-url https://api.example.com/v1 \
  --default-locale bs \
  --description-en "My application description." \
  --description-bs "Opis moje aplikacije."
```

Use local URLs when developing. `--yes` accepts current defaults for unspecified values; `--help` lists every option. Setup creates `.env.local` if absent and preserves unrelated entries in an existing file while updating the two public URLs. `.env.local` is ignored by Git. Public configuration is never a place for secrets. Both URLs must use HTTP or HTTPS without credentials, queries or fragments. Application URLs must be origins; API URLs may include an intentional path prefix. Local HTTP development is supported. Setup and runtime use the same validation.

Setup does not edit `pnpm-lock.yaml`. After personalizing, run `pnpm install` and `pnpm typecheck`; commit any resulting lockfile changes alongside the identity changes. Use frozen installs for subsequent verification.

## Environment and production configuration

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

| Variable              | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Public origin for canonical URLs, metadata and sitemap  |
| `NEXT_PUBLIC_API_URL` | External REST API base URL, optionally including a path |

Values are typed and validated in `src/config/public-env.ts` and embedded at build time. Add new public variables to its schema and access them through `publicEnv`. Never put secrets in `NEXT_PUBLIC_*` variables.

For deployment, supply the real application origin and API URL in the build environment, then run `pnpm build` and deploy to a Node.js-compatible Next.js host. The placeholder makes no API requests, so a running backend is unnecessary until you add a feature. Configure backend CORS and authentication for your frontend origin. Security headers derive the API connection origin from this configuration.

## Add the first feature

Replace `src/app/[locale]/page.tsx` with your application's entry page, or add a route beneath `src/app/[locale]/`. Create `src/features/<feature>/` when needed, colocating UI, Zod schemas, API functions, TanStack Query definitions and meaningful tests. Keep reusable primitives in `src/components/ui`.

Use the locale-aware `Link` and router from `src/i18n/navigation.ts`. Add translations to both `messages/en.json` and `messages/bs.json`; English supplies the message types. Use `createPageMetadata` for public pages and register their paths in `publicRoutes` in `src/config/site.ts` to generate canonical alternates and the sitemap. Add relevant browser tests and Lighthouse routes for new public screens.

Use TanStack's `queryOptions` with the utilities in `src/lib/query` for server state, nuqs for shareable URL state, and React state for temporary UI state. Form tooling is available through React Hook Form, `@hookform/resolvers` and the shared localized Zod error map. The starter intentionally leaves feature schemas, forms, endpoints, access rules and data ownership to you.

## Connect a real REST API

Set `NEXT_PUBLIC_API_URL` to your backend's base URL. Feature API functions can use `apiClient` from `src/lib/api/client.ts`, or `createApiClient` for an independently configured client. Pass a Zod schema to validate and infer each successful response; use `pathParams`, `query`, `body` and `signal` as needed.

The client validates the response against the schema you supply; it does not impose a success envelope. Errors can use this shared format:

```ts
{ error: { code: string; message: string; details?: unknown } }
```

HTTP failures normalize to `AppError`; localized error messages and reporting hooks live in `src/lib/errors`. Query utilities support invalidation, paginated results and optimistic rollback without prescribing an application domain. Write API contract tests using the existing MSW Node server pattern in `src/lib/api/client.test.ts` when adding real integrations.

## Configure authentication and reporting

Use `createApiAuthHooks` in `src/lib/auth/adapter.ts` to connect your provider's session, token retrieval, refresh and unauthorized handling to the API client. It supports bearer-token and cookie sessions, including coordinated refresh for concurrent unauthorized requests. See [the authentication integration guide](docs/authentication.md).

You supply provider initialization, sign-in UI and backend authorization. Connect your monitoring service through `src/lib/errors/reporting.ts` and `src/lib/performance/reporting.ts`; server and client instrumentation hooks are already present.

## Explore reusable UI in Storybook

```bash
pnpm storybook
```

Open [http://localhost:6006](http://localhost:6006). Stories cover buttons, form controls, async states, tables, icons and themes. Edit the source-owned components and add stories beside them for meaningful new states. Run `pnpm build-storybook` to verify the static build.

Add source SVGs to `assets/icons`, then run `pnpm icons:generate`. `pnpm icons:check` verifies generated components.

## Verification

Install Chromium once with `pnpm exec playwright install chromium`. Docker Desktop is required for the canonical Linux visual checks locally.

```bash
pnpm install --frozen-lockfile
pnpm audit:dependencies
pnpm icons:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build-storybook
pnpm build
pnpm test:e2e
pnpm test:e2e:production
pnpm test:visual:docker
pnpm performance:check
git diff --check
```

Run build-based suites sequentially because they share `.next`. The production suite builds and serves on port 3150 and verifies server content without JavaScript, hydration, locale and theme behavior, routing and metadata. Development E2E includes accessibility checks. Visual snapshots cover desktop light/dark and mobile home views. Lighthouse audits both localized home routes with the existing budgets.

Update visual references only for deliberate UI changes using `pnpm test:visual:update:docker`. `pnpm test:visual` and `pnpm test:visual:update` run directly in a compatible Linux environment.

Use `pnpm test` or `pnpm test:watch` for unit tests, `pnpm exec vitest run scripts/setup.test.ts` for setup tests, `pnpm test:e2e:a11y` for accessibility, `pnpm test:e2e:ui` for the browser UI and `pnpm test:e2e:report` for saved reports. `pnpm format` applies formatting; `pnpm analyze` and `pnpm analyze:output` inspect bundles.

GitHub Actions runs quality, E2E, visual and performance jobs. Coverage thresholds, accessibility checks and performance budgets are part of the starter's production quality gates.

## Structure

```text
src/
├── app/                 # Localized pages, metadata and route fallbacks
├── components/
│   ├── icons/           # Generated SVG React components
│   ├── layout/          # Application shell and locale/theme controls
│   ├── providers/       # Query, URL state, toasts and Web Vitals
│   └── ui/              # Reusable primitives, tests and stories
├── config/              # App identity, environment and security headers
├── i18n/                # Locale routing and request configuration
└── lib/                 # API, auth, query, validation and reporting utilities

messages/                # English and Bosnian messages
assets/icons/            # Source SVGs
docs/                    # Integration guides
e2e/                     # Browser, accessibility and visual tests
scripts/                 # Setup and tooling
```

## License

MIT
