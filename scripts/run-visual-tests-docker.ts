import { spawnSync } from "node:child_process";
import { basename, resolve } from "node:path";

import playwrightPackage from "@playwright/test/package.json" with { type: "json" };

import packageJson from "../package.json" with { type: "json" };

const root = resolve(process.cwd());
const volumeName = `${basename(root).replace(/[^a-zA-Z0-9_.-]/g, "-")}-visual-node-modules`;
const image = `mcr.microsoft.com/playwright:v${playwrightPackage.version}-noble`;
const visualCommand = process.argv.includes("--update")
  ? "pnpm test:visual:update"
  : "pnpm test:visual";
const command = [
  "corepack enable",
  `corepack prepare ${packageJson.packageManager} --activate`,
  "pnpm install --frozen-lockfile",
  visualCommand,
].join(" && ");

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--ipc=host",
    "--volume",
    `${root}:/work`,
    "--volume",
    `${volumeName}:/work/node_modules`,
    "--workdir",
    "/work",
    image,
    "bash",
    "-lc",
    command,
  ],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
