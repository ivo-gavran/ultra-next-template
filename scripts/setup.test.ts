import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applySetup,
  parseSetupArgs,
  readSetupDefaults,
  toPackageName,
  validateSetupValues,
} from "./setup";

const temporaryDirectories: string[] = [];

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "ultra-setup-"));
  temporaryDirectories.push(root);
  await Promise.all([
    writeFile(
      join(root, "package.json"),
      `${JSON.stringify({ name: "starter", description: "Starter" }, null, 2)}\n`,
    ),
    writeFile(
      join(root, "site.json"),
      `${JSON.stringify(
        {
          name: "Starter",
          shortName: "Starter",
          defaultLocale: "en",
          localized: {
            en: { description: "English", openGraphLocale: "en_US" },
            bs: { description: "Bosanski", openGraphLocale: "bs_BA" },
          },
        },
        null,
        2,
      )}\n`,
    ),
    writeFile(
      join(root, ".env.example"),
      "# App\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXT_PUBLIC_API_URL=http://localhost:4000\nNEXT_PUBLIC_API_MOCKING=enabled\n",
    ),
    writeFile(
      join(root, "README.md"),
      "# Starter Template\n\nDocumentation.\n",
    ),
  ]);

  return {
    root,
    paths: {
      envExample: ".env.example",
      envLocal: ".env.local",
      package: "package.json",
      readme: "README.md",
      site: "site.json",
    },
  };
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("setup CLI", () => {
  it("parses flags and derives a safe default package name", () => {
    expect(
      parseSetupArgs(["--name=Čista Aplikacija", "--dry-run", "--yes"]),
    ).toMatchObject({
      name: "Čista Aplikacija",
      dryRun: true,
      yes: true,
    });
    expect(toPackageName("Čista Aplikacija")).toBe("cista-aplikacija");
  });

  it("rejects unsafe origins and unsupported locales", () => {
    const values = {
      name: "Product",
      shortName: "Product",
      packageName: "product",
      appUrl: "https://example.com/private",
      apiUrl: "https://api.example.com",
      defaultLocale: "de",
      descriptionEn: "English",
      descriptionBs: "Bosanski",
    };

    expect(() => validateSetupValues(values, ["en", "bs"])).toThrow(
      "Default locale must be one of",
    );
    expect(() =>
      validateSetupValues({ ...values, defaultLocale: "en" }, ["en", "bs"]),
    ).toThrow("must not include a path");
  });

  it("updates identity and environments idempotently", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      name: "Acme Portal",
      shortName: "Acme",
      packageName: "acme-portal",
      appUrl: "https://app.acme.test/",
      apiUrl: "https://api.acme.test/v1/",
      defaultLocale: "bs",
      descriptionEn: "Acme in English",
      descriptionBs: "Acme na bosanskom",
    };

    const dryRun = await applySetup(fixture.root, values, {
      dryRun: true,
      paths: fixture.paths,
    });
    expect(dryRun.changed).toHaveLength(5);
    await expect(
      readFile(join(fixture.root, ".env.local"), "utf8"),
    ).rejects.toThrow();

    const applied = await applySetup(fixture.root, values, {
      paths: fixture.paths,
    });
    expect(applied.changed).toHaveLength(5);
    await expect(
      applySetup(fixture.root, values, { paths: fixture.paths }),
    ).resolves.toMatchObject({ changed: [] });

    const site = JSON.parse(
      await readFile(join(fixture.root, "site.json"), "utf8"),
    );
    expect(site).toMatchObject({
      name: "Acme Portal",
      shortName: "Acme",
      defaultLocale: "bs",
      localized: {
        en: { description: "Acme in English" },
        bs: { description: "Acme na bosanskom" },
      },
    });
    await expect(
      readFile(join(fixture.root, ".env.local"), "utf8"),
    ).resolves.toContain("NEXT_PUBLIC_APP_URL=https://app.acme.test");
    await expect(
      readFile(join(fixture.root, "README.md"), "utf8"),
    ).resolves.toContain("# Acme Portal");
  });

  it("preserves template copy when the identity values are unchanged", async () => {
    const fixture = await createFixture();
    const values = await readSetupDefaults(fixture.root, fixture.paths);

    const result = await applySetup(fixture.root, values, {
      paths: fixture.paths,
    });

    expect(result.changed).toEqual([join(fixture.root, ".env.local")]);
    await expect(
      readFile(join(fixture.root, "README.md"), "utf8"),
    ).resolves.toContain("# Starter Template");
    await expect(
      readFile(join(fixture.root, "package.json"), "utf8"),
    ).resolves.toContain('"description": "Starter"');
  });
});
