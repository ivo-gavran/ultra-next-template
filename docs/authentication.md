# Authentication integration

The template provides an authentication boundary without selecting an identity provider, token store or backend session format. Authorization must always be enforced by the external API. Client route guards only improve navigation; they are not a security boundary.

## Bearer-token providers

Adapt the provider session once and pass the resulting hooks to the API client:

```ts
import { publicEnv } from "@/config/public-env";
import { createApiClient } from "@/lib/api/client";
import { createApiAuthHooks } from "@/lib/auth/adapter";

const auth = createApiAuthHooks({
  getSession: () => authProvider.getSession(),
  getAccessToken: (session) => session.accessToken,
  refreshSession: () => authProvider.refreshSession(),
  onUnauthorized: () => authProvider.signOut(),
});

export const authenticatedApi = createApiClient({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
  auth,
});
```

The API client coordinates concurrent `401` responses into one refresh attempt and retries each active request once. It invokes `onUnauthorized` once per failed shared refresh, or for each final `401` after a retry (also when refresh is absent or explicitly skipped). Notifications run independently of the request, and notification failures are contained by the privacy-safe reporter.

Explicit caller headers take precedence over `getHeaders` and the bearer-token hook, case-insensitively, and remain unchanged on retry. When both provider hooks supply Authorization, a nonempty bearer token takes precedence over the dynamic header. Only headers injected by those providers are removed and fetched again; a null or undefined refreshed token leaves no previous provider bearer token behind. `skipAuth: true` skips `getHeaders`, token retrieval, refresh and unauthorized notifications, while preserving caller headers. `skipAuthRefresh` only disables refresh.

Each request's `AbortSignal` can stop its own refresh wait without stopping refresh for other requests. Cancelled requests are never retried. `refreshTimeoutMs` defaults to 15,000 milliseconds and must be finite and positive. A timeout produces an unauthorized error and one notification; subsequent requests fail fast against that timed-out flight until the underlying provider promise settles. The provider must implement its own termination if it needs to stop that work; the generic client cannot cancel an unknown provider. No overlapping refresh is started while it remains pending. Keep refresh tokens out of `localStorage`; prefer secure, HTTP-only cookies or the identity provider's supported storage strategy.

## Cookie sessions

Cookie-backed APIs do not need `getAccessToken`. Enable credentials and let the backend rotate the cookie:

```ts
const auth = createApiAuthHooks({
  getSession: () => sessionStore.getSession(),
  refreshSession: () => sessionStore.refreshSession(),
  onUnauthorized: () => sessionStore.clear(),
});

export const authenticatedApi = createApiClient({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  auth,
});
```

For cross-origin cookies, configure the backend's CORS allowlist, `SameSite`, `Secure` and CSRF protection together. Do not use a wildcard origin with credentialed requests.

## Protected routes

Protect data at the API first. For server-rendered route protection, read the provider session in a server layout or page and redirect anonymous users before rendering protected content. A client provider may expose session state for menus and transitions, but it must not be the only authorization check.

Provider-specific SDK initialization belongs in a small application adapter. The rest of the application should depend on that adapter and the typed API client rather than importing a vendor SDK throughout feature code.

## API destination contract

Use endpoint-relative paths (`/items` or `items`) with this client. Both append to the configured API prefix: `https://api.example.test/v1` plus `/items` becomes `/v1/items`. Same-origin absolute HTTP(S) URLs are accepted only within that prefix. Protocol-relative URLs, credentials, fragments, dot traversal (including encoded forms), backslashes, encoded separators and nested percent encoding in paths are rejected. Use separately configured clients for independently trusted APIs.

Validation runs before provider hooks. Request options have a runtime allowlist: headers, timeout, response type, signal, body, path parameters, query, schema and the two auth flags. Base URL, adapters, transforms, transports, proxy/socket settings, redirect settings and internal retry markers cannot be overridden per request, even through untyped JavaScript. Host/authority header overrides are rejected. The optional client-level adapter is trusted integration code and must honor the destination and redirect policy.

The default transports use Node HTTP or browser Fetch, never browser XHR. Redirect following is disabled so arbitrary custom authentication headers cannot reach redirect targets. Environment proxy routing is disabled for this credential-bearing client. Call the final API endpoint directly rather than relying on redirects.

## Error telemetry privacy

Application-facing `AppError` messages and details are preserved. Reports use a closed diagnostic vocabulary: known error types, controlled `ErrorCode` values, HTTP statuses, HTTP methods, and the framework's enumerated rendering context. Arbitrary exception/backend text, original stacks, causes, details, URLs, query namespaces and all unrecognized metadata are discarded, regardless of key names. This applies to the console adapter and reporter-failure fallback as well as configured reporters. Deduplication and expected-error suppression remain in place.

Only framework integrations may supply `trustedDigest`; numeric Next.js digests of 1–20 digits are retained. Arbitrary error `digest` properties are never copied. Reporter adapters should send only the sanitized report and must not enrich it with raw errors, requests or session data. This policy intentionally trades raw messages and stack frames for preventing opaque credentials and personal data from entering telemetry.
