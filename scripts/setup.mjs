import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const SETUP_FILES = {
  envExample: ".env.example",
  envLocal: ".env.local",
  package: "package.json",
  readme: "README.md",
  site: "src/config/site-config.json",
};

const VALUE_FLAGS = new Map([
  ["--api-url", "apiUrl"],
  ["--app-url", "appUrl"],
  ["--default-locale", "defaultLocale"],
  ["--description-bs", "descriptionBs"],
  ["--description-en", "descriptionEn"],
  ["--name", "name"],
  ["--package-name", "packageName"],
  ["--short-name", "shortName"],
]);

function parseJson(content, path) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Could not parse ${path}`, { cause: error });
  }
}

function readEnvValue(content, name) {
  return content
    .split(/\r?\n/)
    .find((line) => line.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setEnvValues(content, values) {
  const pending = new Map(Object.entries(values));
  const lines = content.split(/\r?\n/).map((line) => {
    for (const [name, value] of pending) {
      if (line.startsWith(`${name}=`)) {
        pending.delete(name);
        return `${name}=${value}`;
      }
    }
    return line;
  });

  if (pending.size > 0 && lines.at(-1) !== "") lines.push("");
  for (const [name, value] of pending) lines.push(`${name}=${value}`);

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function assertNonEmpty(value, label) {
  if (!value.trim()) throw new Error(`${label} cannot be empty`);
}

function assertOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL origin`);
  }

  if (
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(
      `${label} must not include a path, query, fragment or credentials`,
    );
  }

  return url.origin;
}

function assertUrl(value, label) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
}

export function toPackageName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 214);
}

export function parseSetupArgs(args) {
  const options = { dryRun: false, help: false, yes: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
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

    const [flag, inlineValue] = argument.split("=", 2);
    const optionName = VALUE_FLAGS.get(flag);
    if (!optionName) throw new Error(`Unknown setup option: ${argument}`);

    const value = inlineValue ?? args[index + 1];
    if (!value || (!inlineValue && value.startsWith("--"))) {
      throw new Error(`Missing value for ${flag}`);
    }
    options[optionName] = value;
    if (!inlineValue) index += 1;
  }

  return options;
}

export async function readSetupDefaults(root, files = SETUP_FILES) {
  const [packageContent, siteContent, envContent] = await Promise.all([
    readFile(resolve(root, files.package), "utf8"),
    readFile(resolve(root, files.site), "utf8"),
    readFile(resolve(root, files.envExample), "utf8"),
  ]);
  const packageJson = parseJson(packageContent, files.package);
  const site = parseJson(siteContent, files.site);

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

export function validateSetupValues(values, supportedLocales) {
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
    appUrl: assertOrigin(values.appUrl, "Application URL"),
    apiUrl: assertUrl(values.apiUrl, "API URL"),
  };
}

export async function applySetup(
  root,
  inputValues,
  { dryRun = false, paths: files = SETUP_FILES } = {},
) {
  const paths = Object.fromEntries(
    Object.entries(files).map(([key, path]) => [key, resolve(root, path)]),
  );
  const [packageContent, siteContent, envContent, readmeContent] =
    await Promise.all([
      readFile(paths.package, "utf8"),
      readFile(paths.site, "utf8"),
      readFile(paths.envExample, "utf8"),
      readFile(paths.readme, "utf8"),
    ]);
  const packageJson = parseJson(packageContent, files.package);
  const site = parseJson(siteContent, files.site);
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

  const environment = setEnvValues(envContent, {
    NEXT_PUBLIC_APP_URL: values.appUrl,
    NEXT_PUBLIC_API_URL: values.apiUrl,
  });
  const outputs = new Map([
    [paths.package, `${JSON.stringify(packageJson, null, 2)}\n`],
    [paths.site, `${JSON.stringify(site, null, 2)}\n`],
    [paths.envExample, environment],
    [paths.envLocal, environment],
    [
      paths.readme,
      identityChanged
        ? readmeContent.replace(/^# .+$/m, `# ${values.name}`)
        : readmeContent,
    ],
  ]);

  const changed = [];
  for (const [path, content] of outputs) {
    const current = await readFile(path, "utf8").catch(() => undefined);
    if (current === content) continue;
    changed.push(path);
    if (!dryRun) await writeFile(path, content);
  }

  return { changed, values };
}

async function promptForValues(defaults) {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = async (label, value) => {
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

function printHelp() {
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

async function main() {
  const args = parseSetupArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const root = process.cwd();
  const defaults = await readSetupDefaults(root);
  const promptDefaults = { ...defaults, ...args };
  if (args.name && !args.packageName) {
    promptDefaults.packageName =
      toPackageName(args.name) || defaults.packageName;
  }
  const values = args.yes
    ? { ...defaults, ...args }
    : { ...(await promptForValues(promptDefaults)), ...args };
  const result = await applySetup(root, values, { dryRun: args.dryRun });
  const prefix = args.dryRun ? "Would update" : "Updated";

  if (result.changed.length === 0) {
    console.log("Project already matches the requested setup.");
    return;
  }

  console.log(`${prefix}:`);
  for (const path of result.changed) {
    console.log(`- ${path.replace(`${root}/`, "")}`);
  }
  if (!args.dryRun) {
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
