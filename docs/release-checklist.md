# v1.0.0 release checklist

This is preparation, not authorization to publish. No tag, GitHub Release, external smoke-test repository or repository setting change is part of this PR.

## Repository state observed on 2026-10-17

- `package.json`: `1.0.0`, `private: true` (a GitHub template release, not an npm publication).
- Base: latest `main`, including merged [PR #49](https://github.com/ivo-gavran/ultra-next-template/pull/49), merge commit `18692edcf5ec7e33789d80ce2983b4bd15c58d48`.
- No Git tags or GitHub Releases exist.
- GitHub `is_template` is **false**. The owner must enable **Template repository** before the real creation test and public launch. The README describes the intended workflow and explains the missing-button prerequisite.
- Classic branch protection returns 404, but the active [main ruleset](https://github.com/ivo-gavran/ultra-next-template/rules/25023835) protects the default branch: PR required, strict/up-to-date `quality`, `e2e`, `visual`, `performance` checks; deletion and force pushes blocked; no bypass actors. Required approving reviews: zero; review-thread resolution is not enforced. The smoke is inside `quality`, so no new required-check setting is necessary.
- Recheck these observations immediately before publication; generated repositories do not inherit them.

## Before approving the candidate

- [ ] Review and merge the preparation PR separately; confirm its final GitHub Actions run and subsequent `main` run are green.
- [ ] Confirm frozen install, generated icons, format, lint, types, unit coverage, Storybook, production build, development and production E2E, canonical Linux visual regression, Lighthouse and `pnpm test:template` results in the PR.
- [ ] Re-run `pnpm audit --prod` and the full `pnpm audit`; resolve or explicitly accept remaining development-tool risks in the [dependency assessment](dependency-assessment.md), including a review owner/date. Review peer-range warnings. Production audit should remain clean.
- [ ] Review README, public environment values, API/auth boundaries, security reporting, MIT attribution and the [proposed release notes](releases/v1.0.0.md).
- [ ] Owner verifies the private upstream security-reporting channel is available and monitored.

## Final real GitHub template test — separate approved work

The local smoke cannot verify GitHub generation, remote ownership, settings or Actions availability. The owner will handle this after review and approval; no external repository is created by the preparation work.

- [ ] Owner enables the template setting and confirms **Use this template → Create a new repository** is visible.
- [ ] Create a disposable repository through that flow; clone the **new repository**, verify its own `origin` and independent history.
- [ ] On Node 24.x (at least 24.15.0) and pinned pnpm 11.19.0, run frozen install, interactive `pnpm setup` with a new name/package, both public URLs, descriptions and default locale.
- [ ] Verify `.env.local` remains ignored, `.env.example` contains only public configuration, and repeat setup to confirm no changes.
- [ ] Start development, inspect `/en` and `/bs`, localized metadata, header/manifest identity, theme and locale controls; run frozen install and documented verification, including production build/start.
- [ ] Commit personalized files; confirm GitHub Actions passes in the generated repository. Deliberately regenerate application visual references after branding changes; never overwrite upstream references for the smoke.
- [ ] Configure the new repository's private security contact, Actions access and branch rules; preserve MIT notice. Confirm there is no need to rename the upstream remote or depend on upstream history.
- [ ] Record evidence and dispose of the test repository only under the separately approved procedure.

## Publication — separate approved work

- [ ] Resolve the template flag, real creation test, development-tool advisory disposition and any CI failures before declaring release readiness.
- [ ] Select the reviewed `main` commit, confirm version `1.0.0`, and approve final release notes and known limitations.
- [ ] Only after explicit publication approval, create the `v1.0.0` tag and GitHub Release using the proposed notes. Do not publish the private package to npm.
