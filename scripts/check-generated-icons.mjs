import { spawnSync } from "node:child_process";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const generate = spawnSync(pnpm, ["icons:generate"], {
  stdio: "inherit",
});

if (generate.status !== 0) process.exit(generate.status ?? 1);

const generatedPath = "src/components/icons/generated";
const diff = spawnSync("git", ["diff", "--quiet", "--", generatedPath], {
  stdio: "inherit",
});
const untracked = spawnSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", generatedPath],
  { encoding: "utf8" },
);

if (diff.status !== 0 && diff.status !== 1) process.exit(diff.status ?? 1);
if (untracked.status !== 0) process.exit(untracked.status ?? 1);

if (diff.status === 1 || untracked.stdout.trim()) {
  console.error(
    "Generated icons are out of date. Run `pnpm icons:generate` and commit the result.",
  );
  process.exit(1);
}
