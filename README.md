# Ultra Next Template

A production-minded Next.js starter with a modular developer experience.

The goal is simple: clone it and start on product code. Authentication, protected routes, PostgreSQL, validated API calls, client-side query state, themes, translations, component documentation, tests and CI are already connected.

## What is included

| Area                 | Stack                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Framework            | Next.js 16 App Router, React 19, strict TypeScript                                        |
| Authentication       | Auth.js v5, credentials provider, JWT sessions, protected server layouts and API handlers |
| Database             | PostgreSQL, Drizzle ORM, Drizzle Kit and a committed initial migration                    |
| Data fetching        | A typed `fetch` client with runtime Zod validation and TanStack Query                     |
| Forms                | React Hook Form and shared Zod schemas                                                    |
| UI                   | shadcn/ui (Radix), Tailwind CSS v4, semantic design tokens and dark mode                  |
| Internationalization | `next-intl`, locale-prefixed routing, English and Bosnian                                 |
| Quality              | ESLint, Prettier, Vitest, Testing Library, Storybook and accessibility checks             |
| Workflow             | pnpm, Lefthook, Commitlint, Docker Compose and GitHub Actions                             |

The dashboard includes a small project CRUD flow that demonstrates the full path from an authenticated UI mutation through a protected route handler to an owner-scoped database query.

## Quick start

Requirements: Node.js 24+, pnpm 11+ and Docker.

```bash
pnpm install
cp .env.example .env.local
```

Replace `AUTH_SECRET` in `.env.local` with a generated value:

```bash
openssl rand -base64 32
```

Start PostgreSQL and apply the migration:

```bash
docker compose up -d
pnpm db:migrate
```

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account and visit the protected dashboard.

## Project structure

```text
src/
├── app/                    # Pages, route groups and API route handlers
│   ├── [locale]/           # Localized public/auth/protected pages
│   └── api/                # Auth, registration and project endpoints
├── components/
│   ├── auth/               # Auth forms and session actions
│   ├── dashboard/          # Feature UI
│   ├── layout/             # Header, locale and theme controls
│   ├── providers/          # Client-only app providers
│   └── ui/                 # Reusable design-system primitives
├── config/                 # Validated server environment
├── db/                     # Drizzle client, schema and relations
├── features/               # Schemas, API functions and query hooks
├── i18n/                   # Routing, navigation and request config
├── lib/                    # Framework-neutral utilities
└── test/                   # Shared test setup
```

The boundaries intentionally mirror the reference Expo starter: app composition stays thin, features own their schemas and data operations, reusable UI stays independent, and environment/database code remains server-only.

UI primitives are source-owned shadcn/ui components configured through `components.json`. The starter keeps the standard shadcn API and semantic tokens while applying its own Ultra color theme. Storybook intentionally documents only customized primitives, theme foundations and feature-level states instead of duplicating the full shadcn catalog.

## Authentication and authorization

- Registration validates input, checks email uniqueness and stores a bcrypt hash with cost 12.
- The Credentials provider compares the hash and issues a JWT session.
- The protected route group checks `auth()` in a server layout before rendering.
- Every protected API handler checks the session again.
- Project queries include `ownerId`, preventing cross-account reads and deletes.
- Auth.js adapter tables are present, so OAuth or magic-link providers can be added without redesigning persistence.

For a public production app, add email verification, password reset, rate limiting and abuse monitoring before enabling open registration.

## API pattern

Route handlers return one of two envelopes:

```ts
{ data: T }
{ error: { code: string; message: string; details?: unknown } }
```

`apiRequest` rejects non-2xx responses with a structured `AppError` and parses successful responses through the supplied Zod schema. Stable error codes are mapped to localized user messages, so server copy does not leak directly into the UI. TypeScript types and runtime data therefore cannot silently drift apart.

## Query conventions

Each feature owns a cache contract built with `createEntityQueryFactory`:

```ts
const projectQueryFactory = createEntityQueryFactory("projects");

export const projectKeys = projectQueryFactory.keys;

export const projectQueries = {
  keys: projectKeys,
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

The factory standardizes the key hierarchy for finite lists, infinite lists and details while returning TanStack's native `queryOptions` and `infiniteQueryOptions` objects. Consumers can therefore use every standard TanStack option without learning a replacement API, and invalidate at any scope. `src/lib/query` also includes cursor and page-number pagination helpers plus an optimistic update utility with rollback support. The project delete mutation demonstrates the complete optimistic lifecycle. Loading, error/retry and empty states use shared accessible UI primitives.

TanStack Query DevTools are mounted with the shared query client and are available automatically in development builds. The DevTools package renders nothing in production.

## Route resilience

App Router failures use application-owned fallbacks instead of the framework defaults. Localized route errors provide a retry action and an optional server error reference, unknown URLs render a locale-aware 404 page, and the protected dashboard has an accessible streaming loading state. Root-layout failures fall back to a standalone global error document.

Unexpected route and global errors pass through `reportAppError` in `src/lib/errors/reporting.ts`. It currently writes structured context to the console and provides one integration point for adding an external error-reporting service later.

## Commands

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `pnpm dev`             | Start the development server          |
| `pnpm build`           | Create a production build             |
| `pnpm lint`            | Run ESLint with zero warnings allowed |
| `pnpm typecheck`       | Run strict TypeScript checks          |
| `pnpm test`            | Run the Vitest suite once             |
| `pnpm test:coverage`   | Generate test coverage                |
| `pnpm storybook`       | Start Storybook on port 6006          |
| `pnpm build-storybook` | Build static Storybook output         |
| `pnpm db:generate`     | Generate SQL from schema changes      |
| `pnpm db:migrate`      | Apply committed migrations            |
| `pnpm db:studio`       | Open Drizzle Studio                   |
| `pnpm format`          | Format the repository                 |

## Adding a database change

1. Edit `src/db/schema.ts`.
2. Run `pnpm db:generate`.
3. Review the generated SQL in `drizzle/`.
4. Run `pnpm db:migrate`.
5. Commit both schema and migration changes.

Use `db:push` only for disposable local experimentation; committed environments should use migrations.

## Adding a locale

1. Add the locale to `src/i18n/routing.ts`.
2. Copy a complete message file into `messages/<locale>.json`.
3. Update the locale switcher if you want more than the included two-language toggle.

## CI and local hooks

GitHub Actions verifies formatting, linting, types, unit tests, Storybook and the production build. Lefthook runs the fast static checks before a commit, while Commitlint enforces Conventional Commits for commit messages.

## Deployment

Provide `DATABASE_URL`, `AUTH_SECRET` and `AUTH_TRUST_HOST` to the runtime environment, apply migrations as a release step, then deploy with any Node.js-compatible Next.js host. Never commit `.env.local` or use the Docker Compose credentials outside local development.

## License

MIT
