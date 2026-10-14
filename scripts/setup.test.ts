import fs from "node:fs/promises";
import {
  chmod,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

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
      "# App\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXT_PUBLIC_API_URL=http://localhost:4000\n",
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
  vi.restoreAllMocks();
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

  it("preserves equals signs inside inline option values", () => {
    expect(
      parseSetupArgs([
        "--api-url=https://api.example.test/v1?region=eu",
        "--description-en=Build = ship",
        "--name",
        "Product",
      ]),
    ).toMatchObject({
      apiUrl: "https://api.example.test/v1?region=eu",
      descriptionEn: "Build = ship",
      name: "Product",
    });
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

  it("never writes credential-bearing API URLs into any setup file", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      apiUrl: "https://synthetic-user:synthetic-password@api.example.test/v1",
    };
    const files = [
      "package.json",
      "site.json",
      ".env.example",
      "README.md",
    ].map((path) => join(fixture.root, path));
    const before = await Promise.all(
      files.map((path) => readFile(path, "utf8")),
    );
    await expect(
      applySetup(fixture.root, values, { paths: fixture.paths }),
    ).rejects.toThrow("credentials");
    expect(
      await Promise.all(files.map((path) => readFile(path, "utf8"))),
    ).toEqual(before);
    await expect(
      readFile(join(fixture.root, ".env.local"), "utf8"),
    ).rejects.toThrow();
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

  it("preserves unrelated local environment values and leaves every file untouched in dry-run", async () => {
    const fixture = await createFixture();
    const localEnv =
      "# Local settings\nPRIVATE_SETTING=keep-me\nNEXT_PUBLIC_APP_URL=http://localhost:3000\nNEXT_PUBLIC_API_URL=http://localhost:4000\n";
    await writeFile(join(fixture.root, ".env.local"), localEnv);
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      appUrl: "https://app.example.test",
      apiUrl: "https://api.example.test/v1",
    };
    const files = Object.values(fixture.paths).map((path) =>
      join(fixture.root, path),
    );
    const before = await Promise.all(
      files.map((path) => readFile(path, "utf8")),
    );
    await applySetup(fixture.root, values, {
      dryRun: true,
      paths: fixture.paths,
    });
    expect(
      await Promise.all(files.map((path) => readFile(path, "utf8"))),
    ).toEqual(before);

    await applySetup(fixture.root, values, { paths: fixture.paths });
    await expect(
      readFile(join(fixture.root, ".env.local"), "utf8"),
    ).resolves.toBe(
      "# Local settings\nPRIVATE_SETTING=keep-me\nNEXT_PUBLIC_APP_URL=https://app.example.test\nNEXT_PUBLIC_API_URL=https://api.example.test/v1\n",
    );
    await expect(
      readFile(join(fixture.root, ".env.example"), "utf8"),
    ).resolves.not.toContain("PRIVATE_SETTING");
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
  it("normalizes duplicate dotenv forms while preserving comments and multiline secrets", async () => {
    const fixture = await createFixture();
    const secret =
      'constructor=private\nSECRET="private\nNEXT_PUBLIC_APP_URL=inside-secret\nvalue"\n';
    const source =
      "# keep\n" +
      secret +
      " export NEXT_PUBLIC_APP_URL = \"https://old.test\" # first\nNEXT_PUBLIC_APP_URL: 'https://later.test' # later\nNEXT_PUBLIC_API_URL=`https://old-api.test`\nNEXT_PUBLIC_API_URL=https://last.test\n";
    await writeFile(join(fixture.root, ".env.local"), source);
    const values = await readSetupDefaults(fixture.root, fixture.paths);
    await applySetup(fixture.root, values, { paths: fixture.paths });
    expect(await readFile(join(fixture.root, ".env.local"), "utf8")).toBe(
      "# keep\n" +
        secret +
        "NEXT_PUBLIC_APP_URL=http://localhost:3000 # first\n# later\nNEXT_PUBLIC_API_URL=http://localhost:4000\n\n",
    );
    const before = await stat(join(fixture.root, ".env.local"));
    expect(
      (await applySetup(fixture.root, values, { paths: fixture.paths }))
        .changed,
    ).toEqual([]);
    expect((await stat(join(fixture.root, ".env.local"))).mtimeMs).toBe(
      before.mtimeMs,
    );
  });

  it.each([false, true])(
    "restores all files after a later replacement fails (existing local env: %s)",
    async (existing) => {
      const fixture = await createFixture();
      const local = join(fixture.root, ".env.local");
      if (existing) {
        await writeFile(local, "SECRET=do-not-log\n");
        await chmod(local, 0o640);
      }
      const paths = Object.values(fixture.paths)
        .filter((path) => existing || path !== ".env.local")
        .map((path) => join(fixture.root, path));
      const before = await Promise.all(
        paths.map((path) => readFile(path, "utf8")),
      );
      const values = {
        ...(await readSetupDefaults(fixture.root, fixture.paths)),
        name: "Changed",
        packageName: "changed",
      };
      const actual =
        await vi.importActual<typeof import("node:fs/promises")>(
          "node:fs/promises",
        );
      vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
        if (String(to).endsWith("/README.md")) {
          expect(
            await readFile(join(fixture.root, "package.json"), "utf8"),
          ).toContain('"name": "changed"');
          throw new Error("injected secret must not be printed");
        }
        return actual.rename(from, to);
      });
      await expect(
        applySetup(fixture.root, values, { paths: fixture.paths }),
      ).rejects.toThrow("original files restored");
      expect(
        await Promise.all(paths.map((path) => readFile(path, "utf8"))),
      ).toEqual(before);
      expect(
        (await readdir(fixture.root)).some((name) =>
          name.startsWith(".setup-"),
        ),
      ).toBe(false);
      if (existing) expect((await stat(local)).mode & 0o777).toBe(0o640);
      else await expect(stat(local)).rejects.toMatchObject({ code: "ENOENT" });
      vi.spyOn(fs, "rename").mockImplementation(actual.rename);
      await applySetup(fixture.root, values, { paths: fixture.paths });
      expect((await stat(local)).mode & 0o777).toBe(existing ? 0o640 : 0o600);
      expect(
        (await applySetup(fixture.root, values, { paths: fixture.paths }))
          .changed,
      ).toEqual([]);
    },
  );

  it("aborts on read errors without treating them as missing files", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      packageName: "changed",
    };
    const original = await readFile(join(fixture.root, "package.json"), "utf8");
    const actual =
      await vi.importActual<typeof import("node:fs/promises")>(
        "node:fs/promises",
      );
    vi.spyOn(fs, "readFile").mockImplementation(async (...args) => {
      if (String(args[0]).endsWith("/.env.local"))
        throw Object.assign(new Error("denied"), { code: "EACCES" });
      return actual.readFile(...args);
    });
    await expect(
      applySetup(fixture.root, values, { paths: fixture.paths }),
    ).rejects.toMatchObject({ code: "EACCES" });
    expect(await readFile(join(fixture.root, "package.json"), "utf8")).toBe(
      original,
    );
  });
  it("cleans staged files when preparation fails, without replacing destinations", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      packageName: "changed",
    };
    const original = await readFile(join(fixture.root, "package.json"), "utf8");
    const replace = vi.spyOn(fs, "rename");
    vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"));
    await expect(
      applySetup(fixture.root, values, { paths: fixture.paths }),
    ).rejects.toThrow("original files restored");
    expect(replace).not.toHaveBeenCalled();
    expect(await readFile(join(fixture.root, "package.json"), "utf8")).toBe(
      original,
    );
    expect(
      (await readdir(fixture.root)).some((name) => name.startsWith(".setup-")),
    ).toBe(false);
  });

  it("retains a backup and reports paths if restoration also fails", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      name: "Changed",
      packageName: "changed",
    };
    const original = await readFile(join(fixture.root, "package.json"), "utf8");
    const actualRename = fs.rename;
    vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
      if (
        String(to).endsWith("/README.md") ||
        (String(to).endsWith("/package.json") &&
          String(from).endsWith("/original"))
      )
        throw new Error("secret-error");
      return actualRename(from, to);
    });
    let message = "";
    try {
      await applySetup(fixture.root, values, { paths: fixture.paths });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("recovery or cleanup incomplete");
    expect(message).toContain(join(fixture.root, "package.json"));
    expect(message).not.toContain("secret-error");
    const backups = (await readdir(fixture.root)).filter((name) =>
      name.startsWith(".setup-"),
    );
    expect(backups).toHaveLength(1);
    expect(
      await readFile(join(fixture.root, backups[0]!, "original"), "utf8"),
    ).toBe(original);
  });

  it("never stages or replaces unchanged files or any dry-run output", async () => {
    const fixture = await createFixture();
    const values = await readSetupDefaults(fixture.root, fixture.paths);
    await applySetup(fixture.root, values, { paths: fixture.paths });
    const write = vi.spyOn(fs, "writeFile");
    const replace = vi.spyOn(fs, "rename");
    const stage = vi.spyOn(fs, "mkdtemp");
    await applySetup(fixture.root, values, { paths: fixture.paths });
    await applySetup(
      fixture.root,
      { ...values, name: "Changed" },
      { paths: fixture.paths, dryRun: true },
    );
    expect(write).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(stage).not.toHaveBeenCalled();
  });

  it("normalizes example duplicates and preserves CRLF and inline comments", async () => {
    const fixture = await createFixture();
    await writeFile(
      join(fixture.root, ".env.example"),
      'NEXT_PUBLIC_APP_URL="https://old.test"\r\nexport NEXT_PUBLIC_APP_URL=https://final.test # keep\r\nNEXT_PUBLIC_API_URL: https://api.test\r\n',
    );
    const values = await readSetupDefaults(fixture.root, fixture.paths);
    expect(values.appUrl).toBe("https://final.test");
    expect(values.apiUrl).toBe("https://api.test");
    await applySetup(fixture.root, values, { paths: fixture.paths });
    expect(await readFile(join(fixture.root, ".env.example"), "utf8")).toBe(
      "NEXT_PUBLIC_APP_URL=https://final.test\r\n# keep\r\nNEXT_PUBLIC_API_URL=https://api.test\r\n",
    );
  });
  it("does not swallow a read failure during output comparison", async () => {
    const fixture = await createFixture();
    const values = {
      ...(await readSetupDefaults(fixture.root, fixture.paths)),
      packageName: "changed",
    };
    const path = join(fixture.root, "package.json");
    const original = await readFile(path, "utf8");
    const actualRead = fs.readFile;
    let reads = 0;
    const replace = vi.spyOn(fs, "rename");
    vi.spyOn(fs, "readFile").mockImplementation(async (...args) => {
      if (args[0] === path && ++reads === 2)
        throw Object.assign(new Error("denied"), { code: "EACCES" });
      return actualRead(...args);
    });
    await expect(
      applySetup(fixture.root, values, { paths: fixture.paths }),
    ).rejects.toMatchObject({ code: "EACCES" });
    expect(replace).not.toHaveBeenCalled();
    expect(await readFile(path, "utf8")).toBe(original);
  });
});
