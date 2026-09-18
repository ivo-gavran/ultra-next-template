type SecurityHeadersOptions = {
  apiUrl?: string | undefined;
  isDevelopment?: boolean;
};

type SecurityHeader = {
  key: string;
  value: string;
};

function getOrigin(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function createContentSecurityPolicy({
  apiUrl,
  isDevelopment = false,
}: SecurityHeadersOptions = {}) {
  const apiOrigin = getOrigin(apiUrl);
  const connectSources = ["'self'", apiOrigin].filter(Boolean).join(" ");
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function createSecurityHeaders(
  options: SecurityHeadersOptions = {},
): SecurityHeader[] {
  const { isDevelopment = false } = options;

  return [
    {
      key: "Content-Security-Policy",
      value: createContentSecurityPolicy(options),
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), geolocation=(), microphone=()",
    },
    ...(!isDevelopment
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ]
      : []),
  ];
}
