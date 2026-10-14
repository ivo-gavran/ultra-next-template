/** Shared by runtime configuration and the Node setup CLI; never echo input. */
export function validatePublicUrl(value: string, kind: "app" | "api"): string {
  const label = kind === "app" ? "Application URL" : "API URL";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL`);
  }

  if (
    !/^https?:\/\//i.test(value) ||
    /[\s\\]/.test(value) ||
    (url.protocol !== "http:" && url.protocol !== "https:")
  ) {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL`);
  }
  if (url.username || url.password) {
    throw new Error(`${label} must not include credentials`);
  }
  // Even empty query/fragment delimiters are forbidden in public base URLs.
  if (value.includes("?") || value.includes("#")) {
    throw new Error(`${label} must not include a query or fragment`);
  }
  if (kind === "app" && url.pathname !== "/") {
    throw new Error(`${label} must not include a path`);
  }

  return kind === "app" ? url.origin : url.href.replace(/\/+$/, "");
}
