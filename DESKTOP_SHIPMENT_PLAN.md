# Shotage Desktop Shipment Plan

Last reviewed: 2026-09-23

This is the runbook for building and shipping the Tauri desktop app. It is a **plan**, not an active CI/CD workflow. Follow the release gates before offering a public download.

## The short version

```text
Source: bayukurniawan30/shotage
  push / pull request → checks and test builds (no public release)
  approved version tag → signed macOS + Windows builds
                       → draft GitHub Release in shotage-release
                       → install and update smoke tests
                       → publish release

Distribution: bayukurniawan30/shotage-release
  release assets = installers + signed updater bundles + latest.json
  no Shotage source code or private signing keys
```

The source repository owns code and workflows. The public [shotage-release](https://github.com/bayukurniawan30/shotage-release) repository only distributes binaries and update metadata. GitHub Releases are used as storage; nothing needs to be copied into that repository's source tree.

## Current state and release gates

- `src-tauri/tauri.conf.json` already enables updater artifacts and points to `https://github.com/bayukurniawan30/shotage-release/releases/latest/download/latest.json`.
- The desktop app already checks for updates on startup and offers **Shotage → Check for Updates…**. The About menu reads the installed Tauri version.
- The app version is currently `0.1.0` in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
- There is currently **no** `.github/workflows/` release pipeline. At the time of writing, `src-tauri/` is untracked locally; GitHub Actions cannot build it until the intended Tauri source is committed. Keep `src-tauri/.signing/`, build output, and private keys ignored.
- `TAURI_DESKTOP_PLAN.md` still describes this as an internal prototype. Do not treat a successful CI build as proof that desktop auth, purchases, exports, recovery, platform signing, or updates are production-ready.

Before enabling a public release, complete the acceptance checks in [TAURI_DESKTOP_PLAN.md](TAURI_DESKTOP_PLAN.md), especially packaged-app login, payment return, image/video export parity, macOS and Windows installation, updater behavior, and signing/notarization.

## Workflow design

### 1. Continuous integration: every PR and push to `main`

Add a workflow in the **source** repository that:

1. Checks out the code and installs a pinned Node.js version, pnpm, and Rust toolchain.
2. Runs `pnpm install --frozen-lockfile`.
3. Runs `pnpm run typecheck` and `pnpm run test`.
4. Builds the frontend and, where runner capacity permits, runs a non-publishing Tauri build for macOS and Windows.
5. Reports failures on the PR/push. It must not receive the release-repo token or publish downloads.

Use protected-branch rules so a failing check cannot accidentally become a release. Start with Node 22 in CI, matching the locally working toolchain, and pin actual action versions when the workflow is implemented. Build-time `VITE_*` values must be audited: only public client configuration belongs in a bundled app; server API keys and signing credentials must never enter Vite variables.

### 2. Release trigger: an approved version tag

Do **not** publish a desktop release on every push to `main`. Use a deliberate source tag such as `desktop-v1.0.1` after review. The release workflow must verify that the tag version matches all three files:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

Update `src-tauri/Cargo.lock` if Cargo changes its package entry. Run CI on the exact tagged commit. A version already published must never be silently rebuilt with different bytes; use a new version for a new release.

### 3. Build matrix and artifacts

Use native GitHub-hosted runners, initially:

| Target              | Runner / target               | Public download                             | Updater asset                   |
| ------------------- | ----------------------------- | ------------------------------------------- | ------------------------------- |
| macOS Apple Silicon | macOS, `aarch64-apple-darwin` | Signed/notarized installer (prefer DMG)     | Signed `.app.tar.gz` and `.sig` |
| macOS Intel         | macOS, `x86_64-apple-darwin`  | Signed/notarized installer (prefer DMG)     | Signed `.app.tar.gz` and `.sig` |
| Windows x64         | Windows, x64                  | Installer (choose NSIS or MSI deliberately) | Signed installer and `.sig`     |

Linux can be added later; do not advertise it until built and tested. `bundle.createUpdaterArtifacts: true` is already configured. Tauri's updater signing is mandatory and separate from Apple notarization or Windows code signing.

Use `tauri-apps/tauri-action` as the initial build/publish integration. It supports target-repository `owner`/`repo`, release tags, updater artifact uploads, and `latest.json`. Set its cross-repo `releaseCommitish` to a real ref in the **public release repository**, not the source repository's commit SHA. Verify the action's current inputs before implementing the workflow.

For reliability, prefer one **final publish job** after all platform jobs succeed: collect the signed artifacts, verify all target files and signatures, create/update one draft public-repo Release, and upload `latest.json` only after its referenced assets are present. If using the action's automatic JSON generation from parallel matrix jobs instead, test that it produces a complete manifest rather than one platform overwriting another.

### 4. Public release repository and credentials

Confirm `shotage-release` is public and has a default branch/initial commit. Its GitHub Release for `v1.0.1` should be created as a **draft** first. The release can contain release notes and installers, but no source checkout or signing key.

The source repo's ordinary `GITHUB_TOKEN` is scoped to the source repo. To write a Release in `shotage-release`, use a GitHub App installation token or a fine-grained personal access token limited to **that repository** with **Contents: write**. Store it as a protected source-repo Actions secret, for example `RELEASE_REPO_TOKEN`. Do not paste it into workflow YAML, logs, or the public repo.

Store these separately as protected CI secrets/credentials:

| Credential                                     | Purpose                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `TAURI_SIGNING_PRIVATE_KEY`                    | Signs updater bundles. Back up the existing local key securely before shipping any build with its public key. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`           | Only if the updater key is password-protected.                                                                |
| `RELEASE_REPO_TOKEN`                           | Writes Release assets to `shotage-release`; scope to that repo only.                                          |
| Apple certificate and notarization credentials | Sign and notarize macOS builds for public distribution.                                                       |
| Windows signing credential, if used            | Sign the Windows installer; choose the distribution strategy before public launch.                            |

`src-tauri/.signing/shotage.key` is currently Git-ignored. **Never commit it.** Losing the private updater key after users install a build containing its public key prevents those installations from trusting future updates. A backup outside GitHub Actions is required.

Use a protected GitHub Actions environment for release jobs, ideally with manual approval. Do not expose these secrets to untrusted pull-request workflows.

### 5. Updater manifest and promotion

The packaged app fetches the public `releases/latest/download/latest.json` endpoint. That JSON must include a newer version and a valid URL and signature for **every supported OS/architecture**. The signature value is the **contents** of the generated `.sig` file, not a link to it.

Draft releases are for inspection. Before publishing:

1. Confirm every installer and updater bundle exists and downloads successfully.
2. Confirm `latest.json` points to the exact release assets in `shotage-release` and has all required platform entries.
3. Verify signatures and macOS notarization; install the apps on clean test systems.
4. Publish the draft only after the release is complete. The `releases/latest` updater endpoint must resolve to a published stable release with a valid manifest.

Keep beta/prerelease updates on a separate endpoint or channel. Do not allow a beta release to become the stable `latest.json` accidentally.

## Release-day checklist

### Before tagging

- [ ] Feature freeze and review the desktop release notes.
- [ ] Confirm `src-tauri/` and the release workflow are committed; `.signing/`, `target/`, and local artifacts are not.
- [ ] Sync version numbers in package, Tauri config, and Cargo manifest.
- [ ] CI passes on the exact commit to release.
- [ ] Test packaged-app magic link, Google/GitHub login, logout, payment return, and account state.
- [ ] Test empty-placeholder, uploaded-image, text, code frame, shadows, PNG/JPEG/WebP, and video exports on macOS and Windows.
- [ ] Confirm updater signing key backup and release credentials are available.
- [ ] Confirm macOS signing/notarization and Windows installer strategy.

### Build and draft

- [ ] Create the approved source tag, for example `desktop-v1.0.1`.
- [ ] Confirm all platform jobs completed from that tag, not from a moving branch.
- [ ] Confirm the public `v1.0.1` draft Release contains only intended files.
- [ ] Check installer names, OS/architecture mapping, file sizes, signatures, and `latest.json` URLs.
- [ ] Check packaged apps show the expected version in **About Shotage Studio**.

### Test and publish

- [ ] Clean-install each platform build and open a representative design.
- [ ] Test an installed previous version updating to the candidate release; verify `.shotage` files, recovery draft, settings, and login survive.
- [ ] Publish the draft Release after all checks pass.
- [ ] Verify the public `releases/latest/download/latest.json` returns the published version and valid downloads.
- [ ] Check update detection from an older installed version and monitor support reports.

## If a release goes wrong

- Stop promoting or linking the bad release while investigating. Keep the last known-good installers available.
- A static updater normally installs **newer** versions; simply repointing `latest.json` to an older version is not a reliable rollback for users who already installed the bad one.
- Fix the issue and publish a higher-version hotfix signed with the **same updater key**. Do not overwrite a published release's binaries under the same version.
- If the updater manifest is broken, provide a direct installer link and clear manual recovery instructions.

## Implementation order when ready

1. Commit the intended Tauri source safely; verify private key paths are ignored.
2. Add non-publishing CI and make it green.
3. Configure cross-repo release access and protected signing secrets.
4. Add tag-triggered draft-release workflow for macOS and Windows.
5. Test the pipeline with an internal candidate before public promotion.
6. Perform a real installed-version update test, then enable public releases.

## References

- [Tauri GitHub Actions pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [Tauri Action inputs and release behavior](https://github.com/tauri-apps/tauri-action)
- [Tauri updater signing and manifest format](https://v2.tauri.app/plugin/updater/)
- [Tauri macOS and Windows distribution](https://v2.tauri.app/distribute/)
- [GitHub Actions token scope](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub Release API permissions](https://docs.github.com/en/rest/releases/releases)
