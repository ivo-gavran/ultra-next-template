# Authentication integration

The template provides an authentication boundary without selecting an identity provider, token store or backend session format. Authorization must always be enforced by the external API. Client route guards only improve navigation; they are not a security boundary.

## Bearer-token providers

Adapt the provider session once and pass the resulting hooks to the API client:

```ts
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

The API client coordinates concurrent `401` responses into one refresh attempt, retries each waiting request once and invokes `onUnauthorized` if refresh fails. Keep refresh tokens out of `localStorage`; prefer secure, HTTP-only cookies or the identity provider's supported storage strategy.

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
