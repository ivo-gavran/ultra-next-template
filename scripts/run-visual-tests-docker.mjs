import { spawnSync } from "node:child_process";
import { basename, resolve } from "node:path";

const root = resolve(process.cwd());
const volumeName = `${basename(root).replace(/[^a-zA-Z0-9_.-]/g, "-")}-visual-node-modules`;
const image = "mcr.microsoft.com/playwright:v1.63.0-noble";
const visualCommand = process.argv.includes("--update")
  ? "pnpm test:visual:update"
  : "pnpm test:visual";
const command = [
  "corepack enable",
  "corepack prepare pnpm@11.19.0 --activate",
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
