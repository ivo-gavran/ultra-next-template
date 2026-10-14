import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { validatePublicUrl } from "../src/config/url-validation.ts";

export type SetupPaths = {
  envExample: string;
  envLocal: string;
  package: string;
  readme: string;
  site: string;
};

export type SetupValues = {
  apiUrl: string;
  appUrl: string;
  defaultLocale: string;
  descriptionBs: string;
  descriptionEn: string;
  name: string;
  packageName: string;
  shortName: string;
};

export type SetupArgs = Partial<SetupValues> & {
  dryRun: boolean;
  help: boolean;
  yes: boolean;
};

type PackageJson = {
  name: string;
  description?: string;
  [key: string]: unknown;
};

type SiteLocale = {
  description: string;
  openGraphLocale: string;
};

type SiteConfig = {
  name: string;
  shortName: string;
  defaultLocale: string;
  localized: Record<string, SiteLocale> & {
    en: SiteLocale;
    bs: SiteLocale;
  };
};

const SETUP_FILES: SetupPaths = {
  envExample: ".env.example",
  envLocal: ".env.local",
  package: "package.json",
  readme: "README.md",
  site: "src/config/site-config.json",
};

const VALUE_FLAGS = new Map<string, keyof SetupValues>([
  ["--api-url", "apiUrl"],
  ["--app-url", "appUrl"],
  ["--default-locale", "defaultLocale"],
  ["--description-bs", "descriptionBs"],
  ["--description-en", "descriptionEn"],
  ["--name", "name"],
  ["--package-name", "packageName"],
  ["--short-name", "shortName"],
]);

function parseJson<T>(content: string, path: string): T {
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Could not parse ${path}`, { cause: error });
  }
}

function readEnvValue(content: string, name: string): string | undefined {
  return content
    .split(/\r?\n/)
    .find((line) => line.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setEnvValues(content: string, values: Record<string, string>): string {
  const pending = new Map(Object.entries(values));
  const lines = content.split(/\r?\n/).map((line) => {
    const separator = line.indexOf("=");
    if (separator < 0) return line;

    const name = line.slice(0, separator);
    const value = pending.get(name);
    if (value === undefined) return line;

    pending.delete(name);
    return `${name}=${value}`;
  });

  if (pending.size > 0 && lines.at(-1) !== "") lines.push("");
  for (const [name, value] of pending) lines.push(`${name}=${value}`);

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} cannot be empty`);
}

export function toPackageName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 214);
}

export function parseSetupArgs(args: string[]): SetupArgs {
  const options: SetupArgs = { dryRun: false, help: false, yes: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;
    if (argument === "--") continue;
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--yes" || argument === "-y") {
      options.yes = true;
      continue;
    }

    const separator = argument.indexOf("=");
    const flag = separator < 0 ? argument : argument.slice(0, separator);
    const inlineValue =
      separator < 0 ? undefined : argument.slice(separator + 1);
    const optionName = VALUE_FLAGS.get(flag);
    if (!optionName) throw new Error(`Unknown setup option: ${argument}`);

    const value = inlineValue ?? args[index + 1];
    if (!value || (inlineValue === undefined && value.startsWith("--"))) {
      throw new Error(`Missing value for ${flag}`);
    }
    options[optionName] = value;
    if (inlineValue === undefined) index += 1;
  }

  return options;
}

export async function readSetupDefaults(
  root: string,
  files: SetupPaths = SETUP_FILES,
): Promise<SetupValues> {
  const [packageContent, siteContent, envContent] = await Promise.all([
    readFile(resolve(root, files.package), "utf8"),
    readFile(resolve(root, files.site), "utf8"),
    readFile(resolve(root, files.envExample), "utf8"),
  ]);
  const packageJson = parseJson<PackageJson>(packageContent, files.package);
  const site = parseJson<SiteConfig>(siteContent, files.site);

  return {
    apiUrl: readEnvValue(envContent, "NEXT_PUBLIC_API_URL") ?? "",
    appUrl: readEnvValue(envContent, "NEXT_PUBLIC_APP_URL") ?? "",
    defaultLocale: site.defaultLocale,
    descriptionBs: site.localized.bs.description,
    descriptionEn: site.localized.en.description,
    name: site.name,
    packageName: packageJson.name,
    shortName: site.shortName,
  };
}

export function validateSetupValues(
  values: SetupValues,
  supportedLocales: string[],
): SetupValues {
  assertNonEmpty(values.name, "Application name");
  assertNonEmpty(values.shortName, "Short name");
  assertNonEmpty(values.descriptionEn, "English description");
  assertNonEmpty(values.descriptionBs, "Bosnian description");

  if (
    !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(
      values.packageName,
    )
  ) {
    throw new Error("Package name must be a valid lowercase npm package name");
  }
  if (!supportedLocales.includes(values.defaultLocale)) {
    throw new Error(
      `Default locale must be one of: ${supportedLocales.join(", ")}`,
    );
  }

  return {
    ...values,
    appUrl: validatePublicUrl(values.appUrl, "app"),
    apiUrl: validatePublicUrl(values.apiUrl, "api"),
  };
}

export async function applySetup(
  root: string,
  inputValues: SetupValues,
  options: { dryRun?: boolean; paths?: SetupPaths } = {},
) {
  const { dryRun = false, paths: files = SETUP_FILES } = options;
  const paths: SetupPaths = {
    envExample: resolve(root, files.envExample),
    envLocal: resolve(root, files.envLocal),
    package: resolve(root, files.package),
    readme: resolve(root, files.readme),
    site: resolve(root, files.site),
  };
  const [packageContent, siteContent, envContent, readmeContent] =
    await Promise.all([
      readFile(paths.package, "utf8"),
      readFile(paths.site, "utf8"),
      readFile(paths.envExample, "utf8"),
      readFile(paths.readme, "utf8"),
    ]);
  const packageJson = parseJson<PackageJson>(packageContent, files.package);
  const site = parseJson<SiteConfig>(siteContent, files.site);
  const values = validateSetupValues(inputValues, Object.keys(site.localized));
  const identityChanged = values.name !== site.name;
  const englishDescriptionChanged =
    values.descriptionEn !== site.localized.en.description;

  packageJson.name = values.packageName;
  if (identityChanged || englishDescriptionChanged) {
    packageJson.description = values.descriptionEn;
  }
  site.name = values.name;
  site.shortName = values.shortName;
  site.defaultLocale = values.defaultLocale;
  site.localized.en.description = values.descriptionEn;
  site.localized.bs.description = values.descriptionBs;

  const environmentValues = {
    NEXT_PUBLIC_APP_URL: values.appUrl,
    NEXT_PUBLIC_API_URL: values.apiUrl,
  };
  const environment = setEnvValues(envContent, environmentValues);
  const localEnvironment = await readFile(paths.envLocal, "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return envContent;
      throw error;
    },
  );
  const outputs = new Map<string, string>([
    [paths.package, `${JSON.stringify(packageJson, null, 2)}\n`],
    [paths.site, `${JSON.stringify(site, null, 2)}\n`],
    [paths.envExample, environment],
    [paths.envLocal, setEnvValues(localEnvironment, environmentValues)],
    [
      paths.readme,
      identityChanged
        ? readmeContent.replace(/^# .+$/m, `# ${values.name}`)
        : readmeContent,
    ],
  ]);

  const changed: string[] = [];
  for (const [path, content] of outputs) {
    const current = await readFile(path, "utf8").catch(() => undefined);
    if (current === content) continue;
    changed.push(path);
    if (!dryRun) await writeFile(path, content);
  }

  return { changed, values };
}

async function promptForValues(defaults: SetupValues): Promise<SetupValues> {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = async (label: string, value: string): Promise<string> => {
    const answer = await prompt.question(`${label} (${value}): `);
    return answer.trim() || value;
  };

  try {
    const name = await ask("Application name", defaults.name);
    const suggestedPackageName =
      name === defaults.name
        ? defaults.packageName
        : toPackageName(name) || defaults.packageName;

    return {
      name,
      shortName: await ask("Short name", defaults.shortName),
      packageName: await ask("Package name", suggestedPackageName),
      appUrl: await ask("Application URL", defaults.appUrl),
      apiUrl: await ask("API URL", defaults.apiUrl),
      defaultLocale: await ask("Default locale", defaults.defaultLocale),
      descriptionEn: await ask("English description", defaults.descriptionEn),
      descriptionBs: await ask("Bosnian description", defaults.descriptionBs),
    };
  } finally {
    prompt.close();
  }
}

function printHelp(): void {
  console.log(`Usage: pnpm run setup -- [options]

Options:
  --name <value>             Application name
  --short-name <value>       Manifest short name
  --package-name <value>     Lowercase npm package name
  --app-url <origin>         Canonical application origin
  --api-url <url>            External API base URL
  --default-locale <locale>  Default locale (en or bs)
  --description-en <value>   English application description
  --description-bs <value>   Bosnian application description
  --dry-run                  Validate and list changes without writing
  --yes, -y                  Accept current values for unspecified options
  --help, -h                 Show this help`);
}

async function main(): Promise<void> {
  const { dryRun, help, yes, ...overrides } = parseSetupArgs(
    process.argv.slice(2),
  );
  if (help) {
    printHelp();
    return;
  }

  const root = process.cwd();
  const defaults = await readSetupDefaults(root);
  const promptDefaults: SetupValues = { ...defaults, ...overrides };
  if (overrides.name && !overrides.packageName) {
    promptDefaults.packageName =
      toPackageName(overrides.name) || defaults.packageName;
  }
  const values = yes
    ? promptDefaults
    : { ...(await promptForValues(promptDefaults)), ...overrides };
  const result = await applySetup(root, values, { dryRun });
  const prefix = dryRun ? "Would update" : "Updated";

  if (result.changed.length === 0) {
    console.log("Project already matches the requested setup.");
    return;
  }

  console.log(`${prefix}:`);
  for (const path of result.changed) {
    console.log(`- ${path.replace(`${root}/`, "")}`);
  }
  if (!dryRun) {
    console.log("\nRun pnpm install and pnpm typecheck to verify the project.");
  }
}

const isMainModule =
  process.argv[1] &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
