import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

// Copy working-tree source (including uncommitted changes), never local secrets,
// dependencies, build output, Git history or remotes. Only the copy is executed.
const source = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = await fs.mkdtemp(join(tmpdir(), "derived-application-"));
const application = join(temporary, "orbit-workspace");
const controller = new AbortController();
const children = new Set<ReturnType<typeof spawn>>();
const env: Record<string, string | undefined> = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  LEFTHOOK: "0",
};
for (const key of Object.keys(env)) {
  if (key.startsWith("NEXT_PUBLIC_") || key.startsWith("npm_package_"))
    delete env[key];
}
delete env.NODE_ENV;
delete env.INIT_CWD;

function stop(child: ReturnType<typeof spawn>) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    // Terminate pnpm/Next workers too, before removing their working directory.
    if (process.platform !== "win32" && child.pid)
      process.kill(-child.pid, "SIGKILL");
    else child.kill("SIGKILL");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}
function interrupt() {
  controller.abort(new Error("Derived application smoke test interrupted"));
  for (const child of children) stop(child);
}
process.on("SIGINT", interrupt);
process.on("SIGTERM", interrupt);

function launch(
  command: string,
  args: string[],
  cwd = application,
  capture = false,
) {
  controller.signal.throwIfAborted();
  console.log(`\n[derived-app] ${command} ${args.join(" ")}`);
  const child = spawn(command, args, {
    cwd,
    // Next augments ProcessEnv with a required NODE_ENV; its CLI sets that value.
    env: env as NodeJS.ProcessEnv,
    detached: process.platform !== "win32",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  children.add(child);
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  const timeout = setTimeout(() => stop(child), 10 * 60_000);
  const done = new Promise<string>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      children.delete(child);
      if (code === 0) resolve(output);
      else
        reject(
          new Error(`${command} ${args.join(" ")} failed (${signal ?? code})`),
        );
    });
  });
  // A server may exit while HTTP assertions are in progress.
  void done.catch(() => {});
  return { child, done };
}
async function run(
  command: string,
  args: string[],
  cwd = application,
  capture = false,
) {
  return launch(command, args, cwd, capture).done;
}
async function fingerprint(root: string, paths: string[]) {
  return Promise.all(
    paths.map(async (path) => {
      try {
        const content = await fs.readFile(join(root, path));
        const stat = await fs.stat(join(root, path));
        return [
          path,
          createHash("sha256").update(content).digest("hex"),
          stat.mtimeMs,
        ];
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
          return [path, null];
        throw error;
      }
    }),
  );
}

let original: Awaited<ReturnType<typeof fingerprint>> | undefined;
let sourcePaths: string[] = [];
try {
  const files = (
    await run(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      source,
      true,
    )
  )
    .split("\0")
    .filter(Boolean);
  const copyPaths = [...new Set(files)].filter(
    (path) => !path.startsWith(".env") || path === ".env.example",
  );
  sourcePaths = [...copyPaths, ".env.local"];
  original = await fingerprint(source, sourcePaths);
  for (const path of copyPaths) {
    const from = join(source, path);
    const stat = await fs.lstat(from);
    assert(stat.isFile(), `Expected a regular source file: ${path}`);
    await fs.mkdir(dirname(join(application, path)), { recursive: true });
    await fs.copyFile(from, join(application, path));
  }
  await run("git", ["init", "--initial-branch=main"]);
  assert.equal(await run("git", ["remote"], application, true), "");
  await run("pnpm", ["install", "--frozen-lockfile"]);
  const lockfile = await fs.readFile(
    join(application, "pnpm-lock.yaml"),
    "utf8",
  );
  const appUrl = "https://orbit.example.test";
  const apiUrl = "https://services.example.test/v2";
  const name = "Orbit Workspace";
  const shortName = "Orbit";
  const descriptions = {
    en: "An independent workspace.",
    bs: "Nezavisni radni prostor.",
  };
  const setup = [
    "setup",
    "--",
    "--yes",
    "--name",
    name,
    "--short-name",
    shortName,
    "--package-name",
    "orbit-workspace",
    "--app-url",
    appUrl,
    "--api-url",
    apiUrl,
    "--default-locale",
    "bs",
    "--description-en",
    descriptions.en,
    "--description-bs",
    descriptions.bs,
  ];
  await run("pnpm", setup);
  const personalized = [
    "package.json",
    "src/config/site-config.json",
    "README.md",
    ".env.example",
    ".env.local",
    "pnpm-lock.yaml",
  ];
  const first = await fingerprint(application, personalized);
  await run("pnpm", setup);
  assert.deepEqual(
    await fingerprint(application, personalized),
    first,
    "Setup must not rewrite identical configuration",
  );
  await run("pnpm", ["install", "--frozen-lockfile"]);
  assert.equal(
    await fs.readFile(join(application, "pnpm-lock.yaml"), "utf8"),
    lockfile,
  );
  const pkg = JSON.parse(
    await fs.readFile(join(application, "package.json"), "utf8"),
  );
  assert.equal(pkg.name, "orbit-workspace");
  assert.equal(pkg.description, descriptions.en);
  assert.match(
    await fs.readFile(join(application, "README.md"), "utf8"),
    /^# Orbit Workspace\n/,
  );
  for (const file of [".env.example", ".env.local"]) {
    const contents = await fs.readFile(join(application, file), "utf8");
    assert(contents.includes(`NEXT_PUBLIC_APP_URL=${appUrl}`));
    assert(contents.includes(`NEXT_PUBLIC_API_URL=${apiUrl}`));
  }
  for (const command of ["format:check", "lint", "typecheck"])
    await run("pnpm", [command]);
  await run("pnpm", [
    "exec",
    "vitest",
    "run",
    "scripts/setup.test.ts",
    "src/config",
    "src/i18n",
    "src/lib/metadata.test.ts",
    "src/app/metadata-routes.test.ts",
    "src/lib/api/client.test.ts",
    "src/lib/auth/adapter.test.ts",
  ]);
  await run("pnpm", ["build"]);

  // Use an ephemeral local port; public metadata must retain the configured HTTPS origin.
  const reservation = createServer();
  await new Promise<void>((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const address = reservation.address();
  assert(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  const server = launch("pnpm", [
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ]);
  const origin = `http://127.0.0.1:${port}`;
  async function request(path: string) {
    controller.signal.throwIfAborted();
    return fetch(`${origin}${path}`, {
      redirect: "manual",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
    });
  }
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.child.exitCode !== null)
      throw new Error("Production server exited before readiness");
    try {
      ready = (await request("/bs")).ok;
    } catch {
      controller.signal.throwIfAborted();
    }
    if (ready) break;
    await delay(250, undefined, { signal: controller.signal });
  }
  assert(ready, "Production server did not become ready");
  // Resolve the parser from the independently installed copy, not upstream node_modules.
  const { JSDOM } = createRequire(join(application, "package.json"))(
    "jsdom",
  ) as {
    JSDOM: new (html: string) => {
      window: { document: Document; close(): void };
    };
  };
  for (const locale of ["en", "bs"] as const) {
    const response = await request(`/${locale}`);
    assert.equal(response.status, 200);
    assert(
      response.headers
        .get("content-security-policy")
        ?.includes(new URL(apiUrl).origin),
    );
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    assert.equal(document.documentElement.lang, locale);
    assert.equal(document.title, name);
    assert.equal(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
      descriptions[locale],
    );
    assert.equal(
      document
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content"),
      name,
    );
    assert.equal(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      `${appUrl}/${locale}`,
    );
    for (const alternate of ["en", "bs", "x-default"]) {
      assert.equal(
        document
          .querySelector(`link[hreflang="${alternate}"]`)
          ?.getAttribute("href"),
        `${appUrl}/${alternate === "x-default" ? "bs" : alternate}`,
      );
    }
    assert(document.body.textContent?.includes(name));
    assert(document.querySelector("header")?.textContent?.includes(shortName));
    assert(
      !/ultra-next-template|Ultra Next/.test(html),
      "Upstream identity leaked into the application",
    );
    dom.window.close();
  }
  const redirect = await request("/");
  assert([307, 308].includes(redirect.status));
  assert.equal(
    new URL(redirect.headers.get("location")!, origin).pathname,
    "/bs",
  );
  const manifestResponse = await request("/manifest.webmanifest");
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, name);
  assert.equal(manifest.short_name, shortName);
  assert.equal(manifest.lang, "bs");
  assert.equal(manifest.start_url, "/bs");
  for (const path of ["/sitemap.xml", "/robots.txt"]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    const content = await response.text();
    assert(content.includes(appUrl));
    assert(!/ultra-next-template|Ultra Next/.test(content));
    if (path === "/sitemap.xml")
      for (const locale of ["en", "bs"])
        assert(content.includes(`${appUrl}/${locale}`));
  }
  console.log(
    "\n[derived-app] Independent installation, identity, locales and production metadata verified.",
  );
} finally {
  const running = [...children];
  for (const child of running) stop(child);
  await Promise.all(
    running.map(
      (child) =>
        new Promise<void>((resolve) => child.once("close", () => resolve())),
    ),
  );
  await fs.rm(temporary, { recursive: true, force: true, maxRetries: 3 });
  process.off("SIGINT", interrupt);
  process.off("SIGTERM", interrupt);
  if (original)
    assert.deepEqual(
      await fingerprint(source, sourcePaths),
      original,
      "Original source or local environment changed",
    );
  console.log(
    "[derived-app] Temporary copy removed; original source unchanged.",
  );
}
