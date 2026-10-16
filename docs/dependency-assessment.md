# Dependency assessment — v1.0.0 preparation

Reviewed 2026-10-17 with Node 24.21.0 and pnpm 11.19.0. Re-run the audit before release; advisory data changes independently of the lockfile.

## fast-uri remediation

[GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) is a moderate host-normalization advisory affecting `fast-uri@3.1.7`. Percent-encoded uppercase host characters can produce inconsistent comparisons for scheme-relative references, affecting consumers that base case-sensitive host decisions on the parser. The [upstream 3.1.8 patch](https://github.com/fastify/fast-uri/releases/tag/v3.1.8) fixes it.

The production paths in this lockfile were:

```text
@hookform/resolvers@5.9.1 → ajv@8.20.0 → fast-uri@3.1.7
@hookform/resolvers@5.9.1 → ajv-formats@2.1.1 → ajv@8.20.0 → fast-uri@3.1.7
```

Development paths converge on the same `ajv@8.20.0` instance:

- `@commitlint/cli → @commitlint/load → @commitlint/config-validator → ajv` (also through `@commitlint/resolve-extends`).
- `shadcn → @modelcontextprotocol/sdk → ajv` (also through `ajv-formats@3.0.1`).
- `shadcn → @dotenvx/dotenvx → conf → ajv` (also through `ajv-formats@2.1.1` and through `@shadcn/registry → @dotenvx/dotenvx`).

Ajv declares `fast-uri: ^3.0.1`, which permits `3.1.8`. The fix changes only the lockfile's `fast-uri` package resolution, integrity and snapshot references to `3.1.8`; no direct dependency, override, major version or unrelated dependency is changed. The integrity comes from the npm registry's published `3.1.8` metadata. Frozen installs validate that graph. The patch has no runtime dependencies.

The application uses Zod for response/form validation, and its API destination validation uses the platform URL parser rather than `fast-uri`. No application host decision based on `fast-uri` was found; nevertheless this is a production dependency path and was patched instead of waived. Validation includes the advisory's normalization/equality example, frozen installation, production and full audits, and the repository checks recorded in the PR. `pnpm audit --prod` reports **no known vulnerabilities** after the patch.

## Remaining development-tool advisories

The full audit still reports **8 advisories: 5 high, 2 moderate, 1 low**, all in development tooling. The production-only CI gate does not cover these; this is an existing scope, not a new suppression. No audit ignore entries have been added.

| Package / severity             | Dependency path                                                                                                                                                                   | Exposure and disposition                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmp` / high and low           | `@lhci/cli → tmp@0.1.0`; `@lhci/cli → inquirer → external-editor → tmp@0.0.33`                                                                                                    | Temporary path/symlink handling in local/CI tooling. Avoid untrusted temporary-directory inputs. Patched `0.2.6` is outside the existing ranges.                                                           |
| `extract-zip@2.0.1` / two high | `@lhci/cli → [@lhci/utils →] lighthouse → puppeteer-core → @puppeteer/browsers → extract-zip`                                                                                     | Archive extraction risk when processing a malicious browser archive. CI uses Playwright-installed Chromium. A separate scoped patch assessment is needed; no unrelated dependency update is included here. |
| `basic-ftp@5.3.1` / high       | `@lhci/cli → proxy-agent → pac-proxy-agent → get-uri → basic-ftp`, also through Lighthouse's Puppeteer browser tooling                                                            | FTP listing denial of service. The repository audits local HTTP pages and does not configure FTP/PAC inputs. Fixed `6.2.1` crosses a major version.                                                        |
| `braces@3.0.3` / high          | `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`; `shadcn → [@shadcn/registry or ts-morph → @ts-morph/common →] fast-glob → micromatch → braces` | Deeply nested glob patterns can exhaust the stack. Current lint globs are repository-controlled. Assess a compatible patch separately.                                                                     |
| `uuid@8.3.2` / moderate        | `@lhci/cli → uuid`                                                                                                                                                                | Advisory concerns v3/v5/v6 with caller-provided buffers. Fixed `11.1.1` crosses major versions; do not force an override.                                                                                  |
| `sprintf-js@1.0.3` / moderate  | `@lhci/cli → @lhci/utils → js-yaml → argparse → sprintf-js`                                                                                                                       | Unbounded format precision can cause denial of service; current CLI formats are tooling-controlled. Assess separately.                                                                                     |

Sources: [tmp symlink](https://github.com/advisories/GHSA-52f5-9888-hmc6), [tmp traversal](https://github.com/advisories/GHSA-ph9p-34f9-6g65), [extract-zip traversal](https://github.com/advisories/GHSA-jmr9-qjv8-65gv), [extract-zip writes](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3), [basic-ftp](https://github.com/advisories/GHSA-c475-qrg2-pj4r), [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).

These findings are **release risks requiring maintainer disposition**, not a claim of zero exposure or an approved exception. No release acceptance is implied by green production audit CI. Review before publication and no later than **2026-10-31**; prioritize compatible tooling patches, then upstream-supported upgrades for major-version fixes. Do not process untrusted archives, proxy configuration or generated CLI patterns with this tooling in the meantime.

## Compatibility notices

`pnpm peers check` reports existing peer-range mismatches: TypeScript 6 versus `tsconfck`'s TypeScript 5 range; ESLint 10 versus `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react` ranges ending at 9; and MSW 3 versus `@vitest/mocker`'s MSW 2 range. These are not introduced by the patch. Successful tests/builds establish the exercised behavior, not blanket vendor support. Review these alongside tooling updates; do not change unrelated dependencies just to silence warnings.

## Reproduce

```bash
pnpm install --frozen-lockfile
pnpm why fast-uri
pnpm view ajv@8.20.0 dependencies --json
pnpm audit --prod
pnpm audit
pnpm peers check
```

The existing `pnpm audit:dependencies` uses `--prod --audit-level high --ignore-registry-errors`. Release review must also use the strict commands above, preserving and assessing failures instead of treating a registry outage as a clean audit.
