# Shotage Desktop — Tauri Implementation Plan

## Implementation status (September 2026)

The first desktop integration is in this branch: Tauri v2 shell, native menus and window-state persistence, local `.shotage` open/save, desktop export save dialogs, routing of packaged-app API calls to the deployed Shotage API, and an updater check/prompt. The web app remains available through `pnpm dev`.

This is an **internal prototype, not a distributable release**. Authentication (especially Google/GitHub in a desktop WebView), deep-link callback handling, Windows testing, video codec/export validation, recovery-draft UX, and signing/notarization are still open acceptance criteria below. Do not ship or advertise the desktop app until those flows are tested.

To install the macOS Rust prerequisite without Homebrew's automatic update step:

```sh
HOMEBREW_NO_AUTO_UPDATE=1 brew install rustup
rustup default stable
```

Then run `pnpm dev:desktop` for a local development window. A packaged build needs `TAURI_SIGNING_PRIVATE_KEY` set to the updater signing key; see the update section below. The development window needs the local Vite/Hono server; a packaged build does not. macOS builds require Xcode Command Line Tools. Keep `VITE_NEON_AUTH_URL` configured for account testing, and verify that Neon Auth allows the desktop origin before trying provider sign-in.

## Purpose

Build a native desktop edition of Shotage Studio for macOS and Windows using **Tauri v2**, while preserving the existing web product as the primary shared application.

The desktop app should feel like a professional motion-design tool:

- fast to open and resume;
- reliable for large local images and long exports;
- able to save, open, and recover local design files;
- compatible with the existing Shotage account, credits, designs, Explore, and MCP features;
- capable of using native functionality only where it provides real user value.

This is not a rewrite from React to Rust. Tauri is a native shell around the existing React/Vite Studio, with small platform-specific adapters where necessary.

## Recommendation

Use **Tauri v2** as the desktop foundation.

It fits Shotage because the app is already a React/Vite application and its Studio, Canvas, animation timeline, design state, and most export behavior are browser-based. Tauri can package that frontend as a signed macOS and Windows app while adding carefully scoped native features.

Tauri should initially be a **thin desktop shell**. Native video encoding, local-first project storage, and advanced desktop workflows should be added incrementally after the shell, authentication, and existing export pipeline are proven across platforms.

## Current Shotage Architecture

Shotage currently includes:

- React 19 + TypeScript + Vite frontend;
- Hono server/API routes;
- Zustand Studio state and undo/redo history;
- browser canvas rendering and image/video export;
- `mp4-muxer`, `webm-muxer`, and browser media APIs for video export;
- Neon Auth for magic link, Google, and GitHub login;
- Neon/Postgres + Drizzle for accounts, credits, orders, and saved-design metadata;
- Polar for checkout and credit purchases;
- Morphic CMS for Explore/shared design content;
- private/public saved designs;
- MCP tools that create, inspect, validate, and save designs;
- a portable StudioState JSON representation.

Those remain the product foundation. The desktop app should reuse them rather than create a parallel system.

## Target Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                     Shotage Desktop (Tauri)                   │
│                                                              │
│  React / Vite frontend                                       │
│  ├─ Studio canvas, timeline, editors, export UI              │
│  ├─ Zustand StudioState                                      │
│  ├─ Web export pipeline                                      │
│  └─ Desktop adapter layer                                    │
│       ├─ save/open dialogs                                   │
│       ├─ local filesystem access                             │
│       ├─ deep-link handling                                  │
│       ├─ app menus/shortcuts                                 │
│       └─ native export path, later                           │
│                                                              │
│  Tauri / Rust host                                           │
│  ├─ capability permissions                                   │
│  ├─ file-system and dialog plugins                           │
│  ├─ window state and updater                                 │
│  ├─ deep-link and single-instance plugins                    │
│  └─ optional FFmpeg sidecar, later                           │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS only
        ┌───────────────────┼────────────────────┐
        ▼                   ▼                    ▼
┌──────────────┐   ┌───────────────────┐  ┌───────────────────┐
│ shotage.studio│   │ Neon / Hono APIs  │  │ Morphic CMS       │
│ web product   │   │ auth, credits,    │  │ Explore content   │
│ shared routes │   │ purchases, shares │  │ public templates  │
└──────────────┘   └─────────┬─────────┘  └───────────────────┘
                             ▼
                    ┌────────────────┐
                    │ Polar checkout │
                    └────────────────┘
```

### Rules for the boundary

1. The desktop app is an untrusted client, just like the web browser.
2. Do not package server secrets, Polar access tokens, webhook secrets, Morphic write keys, or privileged Neon credentials in the app.
3. Continue using authenticated server APIs for credits, purchases, account data, private sharing, and server-backed design actions.
4. Only expose native capabilities that are needed. File access must be user-selected and narrowly scoped.
5. Keep `StudioState` format compatible between web, desktop, import/export, saved designs, and MCP.

## Supported Platforms

### Initial release

| Platform | Target                                                  | Notes                                                                        |
| -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| macOS    | Apple Silicon and Intel universal build where practical | Uses WebKit / WKWebView. Validate Safari-like media behavior.                |
| Windows  | Windows 10/11 x64                                       | Uses WebView2, Chromium-based. Installer can provision WebView2 when absent. |

### Later evaluation

| Platform      | Decision                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Linux         | Do not promise initially. Test only if demand justifies maintenance of WebKitGTK and packaging variants.            |
| iOS / Android | Continue treating the existing PWA/mobile web experience separately. Tauri mobile is not part of the desktop scope. |

## WebView Compatibility Strategy

Tauri does not ship one identical browser engine on every desktop OS.

- macOS uses WKWebView/WebKit.
- Windows uses WebView2/Chromium.

This matters to Shotage because the Studio depends on canvas, image decoding, fonts, WebGL/CSS effects, and media encoding. A feature that works in Chrome can behave differently in the macOS desktop build.

### Compatibility policy

1. Treat macOS and Windows as first-class test targets from the earliest prototype.
2. Keep a capability-detection layer for optional browser APIs.
3. Preserve a clear fallback/error message when a codec or browser API is unavailable.
4. Do not rely on desktop-only APIs from shared components directly; use an adapter.
5. Record export telemetry/errors through the existing safe server-side error reporting path, without uploading user media.

### Features requiring early validation

- canvas/image rendering parity;
- `OffscreenCanvas`, `ImageBitmap`, and workers where used;
- font loading and export font consistency;
- WebGL/filter/gradient rendering;
- `MediaRecorder`, `VideoEncoder`, WebCodecs, and available codecs;
- MP4/WebM muxing;
- clipboard and drag/drop behavior;
- large-image decode memory use;
- OAuth popup/redirect behavior.

## Product Scope

### Desktop MVP

The first downloadable desktop build should provide:

- Studio editing with the existing user interface;
- existing account login and logout;
- access to existing saved private designs and shared templates;
- web-equivalent image export;
- current video export where the runtime supports it;
- native Save As and Open for portable Shotage project files;
- local autosave/recovery for unsaved work;
- native app menu and familiar keyboard shortcuts;
- remembered window size/position;
- “Open in browser” fallback for checkout, support, and pages that work best on the web.

### Explicitly not in MVP

- native FFmpeg renderer;
- full offline account/credit purchase support;
- local database as the authoritative cloud-design source;
- multiple desktop windows or collaboration;
- custom plugins/extensions for users;
- a separate native implementation of MCP;
- new design features unrelated to desktop workflows.

## UX Model

### Desktop-specific actions

Add desktop actions alongside existing web actions rather than replacing them:

| Action          | Web behavior                     | Desktop behavior                                                             |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| New design      | Create in Studio                 | Same, with autosave recovery draft initialized                               |
| Open            | Import JSON / load saved design  | Native Open dialog for `.shotage`/`.json`, plus existing cloud designs       |
| Save            | Save shared/private cloud design | Save local `.shotage` file; optionally also save cloud copy                  |
| Save As         | Duplicate/export JSON            | Native Save As dialog                                                        |
| Export image    | Browser download                 | Native destination picker, with browser fallback                             |
| Export video    | Browser download                 | Native destination picker, then browser/native pipeline depending on support |
| Buy credits     | Polar checkout in browser        | Open secure external browser checkout, then return to app                    |
| Open shared URL | Studio URL                       | Open matching design inside desktop app when installed; otherwise website    |

### User language

Avoid implying that local save and cloud save are interchangeable:

- **Save to device**: writes a local portable `.shotage` file.
- **Save to Shotage**: saves the design to the user’s cloud library/private shared designs.
- **Export**: creates a PNG/JPEG/WebP/MP4/WebM output file.
- **Recovery draft**: local, temporary unsaved work restored after interruption.

## File Format

### File extension

Use `.shotage` as the recommended project extension.

The contents can initially be JSON for transparency and easy portability. It should contain the complete `StudioState`, plus envelope metadata.

```json
{
  "format": "shotage-project",
  "formatVersion": 1,
  "createdAt": "2026-09-23T00:00:00.000Z",
  "updatedAt": "2026-09-23T00:00:00.000Z",
  "appVersion": "1.0.0",
  "studioState": {}
}
```

### Versioning rules

1. `formatVersion` is separate from the desktop app version.
2. Import must validate the file before mutating the active editor state.
3. Unknown future versions should show a readable unsupported-version error.
4. Add migrations for deprecated field names/defaults as StudioState evolves.
5. Never silently discard unknown user data during import/export.
6. Keep existing JSON import compatible where possible.

### Local image/media portability

The initial decision must be explicit:

| Option                                  | Recommendation                                | Tradeoff                                                   |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Embed image data in the `.shotage` JSON | Good initial choice for reasonable-size files | Portable, but project files can become large.              |
| Store relative local file references    | Later optional workflow                       | Small files, but files break when moved.                   |
| Use a zipped project bundle             | Later                                         | Best for complex projects, but requires migration/tooling. |

For MVP, use the existing image representation where possible. Warn the user when a project becomes unusually large. Do not claim a local file is portable if it contains unresolved external paths.

## Desktop Adapter Layer

Do not scatter `window.__TAURI__` checks across Studio components. Create one small platform abstraction.

Suggested structure:

```text
src/platform/
  runtime.ts             # `web` | `tauri`
  desktop.ts             # stable desktop-facing interface
  webDesktopAdapter.ts   # browser no-op/download fallback
  tauriDesktopAdapter.ts # Tauri plugin calls
  projectFile.ts         # .shotage envelope, parsing, validation, migrations
  shortcuts.ts           # shared command definitions
```

Suggested interface:

```ts
export interface DesktopAdapter {
  isDesktop: boolean;
  openProject(): Promise<StudioProjectFile | null>;
  saveProject(project: StudioProjectFile, options?: { saveAs?: boolean }): Promise<string | null>;
  chooseExportPath(options: ExportPathOptions): Promise<string | null>;
  writeExport(path: string, content: Uint8Array): Promise<void>;
  openExternal(url: string): Promise<void>;
  getRecoveryDraft(): Promise<StudioProjectFile | null>;
  saveRecoveryDraft(project: StudioProjectFile): Promise<void>;
  clearRecoveryDraft(): Promise<void>;
}
```

The web implementation can return browser-compatible behavior, such as downloading a Blob. The Tauri implementation calls the appropriate native plugins.

## Authentication Plan

Shotage uses Neon Auth with email magic links, Google, and GitHub. Authentication is the highest-risk desktop integration point and should be proven before a desktop beta.

### Preferred approach

Use the existing hosted Shotage web auth flow in the system browser when needed, then return to the installed desktop app through a verified deep link.

Example return route:

```text
shotage://auth/callback?code=...&state=...
```

The app exchanges/validates the result using the existing server-side auth flow. Do not trust an arbitrary deep-link payload as proof of identity.

### Why use the system browser

- Provider login works in a familiar, trusted browser context.
- Google/GitHub OAuth often behave more reliably outside embedded WebViews.
- The user can use password managers, passkeys, and existing provider sessions.
- It reduces friction with provider restrictions around embedded user agents.

### OAuth flow requirements

1. Register the desktop return scheme with Tauri’s deep-link plugin.
2. Use the Tauri single-instance plugin so opening the callback activates the existing app window rather than creating a second editor window.
3. Validate callback state/nonce/PKCE server-side or through the auth provider’s supported client flow.
4. Add desktop callback URLs/schemes to Neon Auth and provider configuration only if that configuration requires it.
5. Test magic links, Google, GitHub, logout, cancelled login, expired links, and first-login account provisioning.
6. Do not put OAuth client secrets in the frontend or Rust binary.
7. Show a “Continue in browser” screen while the desktop app waits for completion.

### Checkout and Polar

Keep Polar checkout in the external browser. The desktop app should:

1. Ask the server for the same authenticated checkout URL used by web.
2. Open it via Tauri’s opener plugin in the default browser.
3. Set Polar’s success return to a Shotage web URL that can offer “Open Shotage Desktop,” or to a verified app deep link if supported safely.
4. Refresh `/api/auth/me` / credits after the app receives the return or regains focus.
5. Continue relying on the Polar webhook as the source of truth for credit issuance.

Do not trust checkout success query parameters alone to credit a user.

## Native Capability Plan

Use only official, minimal Tauri plugins initially.

| Capability                               | Tauri feature/plugin | MVP                  | Security scope                                         |
| ---------------------------------------- | -------------------- | -------------------- | ------------------------------------------------------ |
| Native open/save dialogs                 | Dialog               | Yes                  | User-selected file paths only                          |
| Read/write selected project/export files | File System          | Yes                  | Narrow path scopes; no broad home-directory permission |
| External auth/checkout/support URLs      | Opener               | Yes                  | Allowlist expected HTTPS domains where supported       |
| Single app instance                      | Single Instance      | Yes                  | Required for deep links                                |
| Auth callback into app                   | Deep Link            | Yes                  | Strict scheme/path/state validation                    |
| Window size/position persistence         | Window State         | Yes                  | No sensitive data                                      |
| Desktop updater                          | Updater              | Beta or first stable | Signed update artifacts only                           |
| Local recovery metadata                  | Store                | Yes                  | Keep only project state, not server secrets            |
| System clipboard                         | Clipboard            | Later                | User-triggered only                                    |
| Native FFmpeg process                    | Shell/sidecar        | Later                | Fixed bundled executable and fixed arguments only      |

### Tauri capabilities configuration

Tauri v2 permissions must be explicit. Use separate desktop capability files and do not grant broad access simply because it is convenient.

Illustrative structure:

```text
src-tauri/
  capabilities/
    desktop.json
    development.json
```

The production desktop capability should include only the commands necessary for main-window file dialogs, local project file operations, app updates, deep links, and controlled external URL opening.

## Native Menus and Shortcuts

### Shared editor shortcuts

Preserve existing Studio behavior and ensure browser-reserved shortcuts do not conflict in desktop mode.

| Command      | macOS       | Windows      | Notes                                          |
| ------------ | ----------- | ------------ | ---------------------------------------------- |
| New design   | Cmd+N       | Ctrl+N       | Confirm if unsaved changes exist               |
| Open project | Cmd+O       | Ctrl+O       | `.shotage` and supported JSON                  |
| Save project | Cmd+S       | Ctrl+S       | Save to device; use Save As first time         |
| Save As      | Cmd+Shift+S | Ctrl+Shift+S | New location/file name                         |
| Undo         | Cmd+Z       | Ctrl+Z       | Existing Studio history                        |
| Redo         | Cmd+Shift+Z | Ctrl+Shift+Z | Windows may additionally support Ctrl+Y        |
| Group        | Cmd+G       | Ctrl+G       | Prevent browser find behavior in desktop shell |
| Export       | Cmd+E       | Ctrl+E       | Opens export UI                                |
| Close window | Cmd+W       | Ctrl+W       | Prompt if unsaved local draft                  |

### App menu

Add native File, Edit, View, Window, and Help menus. Each should trigger shared frontend commands rather than duplicate editor business logic in Rust.

## Local Recovery and Autosave

### Goal

Users should not lose local work because the app crashes, a video export fails, the laptop sleeps, or they close an unsaved design.

### MVP behavior

1. Persist a recovery draft after meaningful state changes with a debounced interval (for example, 1–3 seconds after editing stops).
2. Store one recovery draft per active local project/design context.
3. On startup, detect a newer recovery draft and offer **Restore**, **Discard**, or **Review**.
4. Clear/rotate the recovery draft only after a successful local save or explicit discard.
5. Do not let recovery drafts overwrite cloud saved designs automatically.
6. Use a size limit and clear UX for very large embedded media.

### Cloud saving

Local recovery is not cloud synchronization. Continue requiring an authenticated user and explicit Share/Save to Shotage action for server-backed private/public designs.

## Export Strategy

### Phase A: Existing web export pipeline

The initial Tauri build should reuse the current image/video render pipeline. After an export Blob is produced, use a native save dialog and write the file through the desktop adapter.

Benefits:

- lowest implementation risk;
- preserves current Studio rendering behavior;
- quickly validates desktop usability;
- no bundled native binary needed.

Risks:

- platform-specific WebView codec support;
- large memory usage during long/complex exports;
- inconsistent MP4 support across engines;
- UI may remain blocked if the current work is on the main thread.

### Phase B: Export reliability improvements

Before native encoding, improve shared rendering architecture where beneficial:

- move frame preparation/render work into workers where supported;
- release canvas/ImageBitmap/object URL resources immediately after export;
- ensure cancelled exports terminate all work and free resources;
- limit concurrent export jobs to one;
- add memory-aware warnings for high resolution/FPS/duration combinations;
- use deterministic progress stages: preparing, rendering frames, encoding, writing file.

### Phase C: Native video exporter (optional)

Only build this after measurements show web export is a material blocker.

Potential design:

```text
React Studio
  → exports deterministic frame sequence or frame chunks
  → passes user-selected output path + constrained config
  → Tauri Rust command invokes bundled FFmpeg sidecar
  → FFmpeg creates MP4
  → app reports native encoding progress/result
```

This can improve codec consistency and may reduce peak WebView memory use, but it introduces substantial responsibility:

- ship, version, license-review, and sign FFmpeg binaries;
- ensure Apple notarization and Windows signing compatibility;
- create secure fixed command construction—never pass arbitrary shell text;
- manage temporary files and crash cleanup;
- test output color, timing, alpha, audio (when supported), and frame accuracy;
- handle disk-space errors and cancellation safely.

The native encoder should be optional behind a feature flag until it matches or exceeds browser-rendered output quality.

### Image export

Image export is the best first native desktop benefit:

- the renderer remains shared;
- the app uses native file save instead of browser downloads;
- users can choose a destination and filename;
- project custom dimensions continue to determine 1x output dimensions.

## Fonts

Shotage currently uses Google Fonts and on-demand loading. Desktop export must account for font availability and readiness.

### Initial behavior

- Keep current web font loading and wait-for-font logic before image/video export.
- Bundle only fonts you own or are licensed to redistribute if offline use becomes required.
- Store the font family name in StudioState as today.
- Present a warning/fallback if a selected font cannot be loaded while offline.

### Later offline font strategy

1. Define an approved bundled-font list and licenses.
2. Package those fonts with the app.
3. Load bundled fonts through `@font-face` in desktop mode.
4. Use local persistent cache for user-selected remote fonts only if licensing and privacy requirements allow it.

Avoid silently substituting fonts during export when exact typography is important.

## External Images and Privacy

Shotage’s current privacy message is based on client-side rendering. The desktop app should preserve that promise.

- User media should be processed locally by default.
- Do not upload original source assets for native export.
- Clearly distinguish cloud-saved design JSON/thumbnail data from original media data.
- When using Explore/Morphic assets, continue fetching only the assets the user explicitly opens.
- Do not log source code contents, local paths, original images, or exported media to analytics/error services.

## Account, Credits, and Creator Unlimited Access

Desktop must use the same server-backed entitlements as web.

| Area                  | Desktop behavior                                                               |
| --------------------- | ------------------------------------------------------------------------------ |
| User profile          | Load from the existing authenticated API                                       |
| Credit balance        | Load/refresh from existing APIs                                                |
| Creator unlimited IDs | Enforced server-side, never trusted only in the desktop client                 |
| Export debiting       | Use the same authenticated server flow and idempotency/retry rules             |
| Purchase history      | Use existing Purchases experience/API, potentially opening web route initially |
| Polar webhooks        | Remain server-to-server only                                                   |

Desktop should never be able to mint credits by editing local state.

## Share, Explore, and Morphic CMS

### Private designs

- A private design URL opened in the desktop app must still require authentication and ownership checks.
- If the app has no valid session, show the same private/not-found-safe experience as the web Studio; do not load a blank document as though the link were valid.

### Public designs and Explore

- Public Explore designs remain sourced from Morphic CMS.
- Opening an Explore template in desktop should create a local editable copy or route through the same existing import behavior.
- The desktop client must not receive the Morphic privileged API key.

### Thumbnails

- Preserve placeholder logic for MCP-generated designs where appropriate.
- Generate local thumbnails only from the rendering state; do not upload a thumbnail without an explicit cloud-share/save action.

## MCP Compatibility

The existing MCP server is server/API-facing and should remain independent from whether the user later opens the design in web or desktop Studio.

Desktop requirements:

- open `shotage.studio/studio?s=<id>` links in the installed app where appropriate;
- deserialize the exact shared `StudioState` schema;
- retain support for groups, masks, anchor points, motion paths, transitions, text animation, blur, code mockup, and all schema-supported fields;
- show a clear unsupported-version error if an MCP-created design is newer than the desktop renderer;
- avoid inventing a separate desktop-only design schema.

Do not give MCP direct native filesystem access in the initial release. An explicit future “Save MCP design to device” user action is safer and easier to understand.

## Security Checklist

### Non-negotiable rules

- [ ] No privileged environment variables or server secrets in Vite build variables, frontend bundles, Rust source, or release artifacts.
- [ ] Use HTTPS for all production server connections.
- [ ] Use Tauri capability permissions with least privilege.
- [ ] File dialogs determine paths; do not grant recursive broad filesystem access.
- [ ] Validate `.shotage` files before loading and limit max input size.
- [ ] Treat imported JSON, shared design JSON, deep links, clipboard contents, and filenames as untrusted input.
- [ ] Validate URL schemes, hostnames, paths, state, and nonce for auth deep links.
- [ ] Use external browser for checkout and provider login if embedded auth is unreliable or unsupported.
- [ ] Keep Polar fulfillment dependent on verified webhooks/server state.
- [ ] Never allow frontend-provided `user_id` to bypass ownership/credit authorization.
- [ ] Pin and verify native sidecars if introduced.
- [ ] Sign/notarize release artifacts and sign update manifests.

### Content security

Define a strict desktop CSP that permits only required Shotage domains, Google Font domains if still used, auth provider redirects, and media/data URI behavior needed by the canvas. Avoid permissive `connect-src *` or remote script execution.

### Code mockup security

Source code is user content. Syntax highlighting must remain client-side and not execute pasted code. Keep Shiki rendering/data handling safe; do not render user code through an executable preview context.

## Error Handling

| Situation                 | User-facing behavior                                                 | Technical handling                                     |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Unsupported video codec   | Explain availability and offer supported format/fallback             | Feature detect before export starts                    |
| Export runs out of memory | Preserve design, cancel cleanly, suggest lower resolution/FPS/stages | Release temporary resources and prevent duplicate jobs |
| Save fails                | Keep editor state and show retry/save-as option                      | Do not mark document as saved                          |
| File import invalid       | Show reason and leave existing design untouched                      | Validate/project migration before store update         |
| Auth callback fails       | Return to sign-in screen with retry                                  | Clear incomplete callback state                        |
| Checkout cancelled        | Preserve logged-in state and return to Studio                        | Refresh account state on focus                         |
| Deep link invalid         | Ignore safely or show not-found state                                | Never use it as authentication proof                   |
| Recovery draft found      | Restore/discard choice                                               | Keep draft until user resolves it                      |

## Development Setup

### Prerequisites

Document and automate setup for contributors:

- Node version matching `package.json` (`>=20.19.0`);
- Rust stable toolchain;
- platform build prerequisites from Tauri’s current documentation;
- Xcode command-line tools on macOS;
- WebView2/runtime and Windows build tools as applicable on Windows;
- code-signing credentials only in secure CI/release environments.

### Proposed directory layout

```text
shotage/
  src/                      # existing shared React app
  src/platform/             # desktop/web abstraction
  src-tauri/
    src/
      lib.rs
      main.rs
      commands/
    capabilities/
      desktop.json
    icons/
    tauri.conf.json
  TAURI_DESKTOP_PLAN.md
```

### Proposed scripts

Add scripts only during implementation:

```json
{
  "dev:desktop": "tauri dev",
  "build:desktop": "tauri build",
  "test:desktop": "...",
  "typecheck": "tsc --noEmit"
}
```

The exact commands and dependencies should be generated using the then-current official Tauri v2 setup process, rather than manually guessing package versions.

### Current desktop development workflow

From the project root, run `pnpm dev:desktop`. Its launcher finds Cargo in the regular Rustup path or the Homebrew Rustup path, even if Cargo is missing from the shell's PATH. Tauri runs the configured `beforeDevCommand` (`pnpm exec vite --host 127.0.0.1`), waits for `http://127.0.0.1:5173`, compiles the Rust shell, and opens that local Vite/Hono app in the desktop window. Keep this command running while editing. React/CSS changes hot-reload; Rust and Tauri configuration changes trigger a native rebuild. The same URL can also be opened in a normal browser for comparison. Do not start a separate `pnpm dev` on port 5173 first; Vite is configured to fail clearly if that fixed port is occupied.

Development uses the local Hono `/api` routes on port 5173; packaged builds use the deployed `https://shotage.studio/api` routes. Desktop updater checks are disabled in dev mode because updates apply to installed builds, not the hot-reload development window. The configured public `shotage-release` repository is only for distributing release artifacts, not for daily source development.

## Implementation Phases

## Phase 0 — Discovery and Compatibility Spike

### Objective

Prove that Shotage can run in Tauri without breaking the Studio’s key rendering, account, and export flows.

### Work

- Create a disposable Tauri v2 branch/prototype.
- Point Tauri dev mode at the existing Vite server.
- Build the existing app with no native feature changes beyond runtime detection.
- Test on one macOS and one Windows system.
- Create a compatibility checklist for canvas, fonts, gradients, mockups, code frame, stage previews, timeline, images, and video export.
- Test magic link, Google, GitHub, checkout handoff, logout, and session restore.
- Measure app startup, idle memory, normal Studio memory, and a representative video export.

### Exit criteria

- Studio opens and edits a normal complex design.
- Private design access is correctly protected.
- At least one image export succeeds on both operating systems.
- Authentication path is chosen based on real OAuth testing.
- Known video-export gaps are written down before MVP scope is committed.

## Phase 1 — Desktop Shell MVP

### Objective

Ship an internal build that feels like Shotage in a desktop window without changing core design behavior.

### Work

- Add `src-tauri` and Tauri configuration.
- Add runtime/desktop adapter abstraction.
- Add native window title/icon/minimum size.
- Persist main window size and position.
- Add single-instance support.
- Add basic native application menus.
- Add an “About Shotage” screen with version/build information.
- Ensure web-only behavior remains unaffected.

### Acceptance criteria

- The same branch can run `pnpm dev` for web and desktop dev command for Tauri.
- StudioState remains compatible across web and desktop.
- No secret is present in packaged artifacts.
- Desktop app functions without a local Hono server; production calls the deployed API endpoints.

## Phase 2 — Authentication and Account Integration

### Objective

Ensure desktop users can use the same Shotage account securely.

### Work

- Implement browser handoff/deep-link return flow if required.
- Add deep-link and single-instance configuration.
- Add a completion screen for browser login/checkout.
- Refresh session/profile/credits after callback and on window focus.
- Test provider cancellation, logout, deleted session, and failed first-account provisioning.

### Acceptance criteria

- Magic link, Google, and GitHub are all tested on macOS and Windows.
- User remains signed in after successful checkout cancellation/return paths as expected.
- Private designs do not render for an unauthenticated or unauthorized desktop user.
- Credits and creator-unlimited behavior exactly match web enforcement.

## Phase 3 — Local Project Files and Recovery

### Objective

Make desktop useful as a local creative application.

### Work

- Define `StudioProjectFile` envelope and Zod validation.
- Implement `.shotage` Open, Save, Save As, and recent-file metadata.
- Add dirty state tracking and close-window confirmation.
- Implement debounced recovery drafts and restore UI.
- Add import migration/error messages.
- Add native drag-and-drop for `.shotage` files and local image assets where safe.

### Acceptance criteria

- Local save/open preserves a complex design faithfully.
- Broken/invalid project input cannot replace the current design.
- Closing with unsaved changes prompts the user.
- A simulated restart restores a recovery draft without corrupting it.

## Phase 4 — Native Image Export

### Objective

Make image export feel native and predictable.

### Work

- Reuse current render output.
- Use native save dialog and write output with user-selected filename/path.
- Preserve existing custom-size semantics: 1x export uses the specified custom dimensions.
- Add an export completion action: Reveal in Finder / Open file / Copy path where platform-safe.

### Acceptance criteria

- PNG/JPEG/WebP exports have expected size and colors.
- Cancelled save leaves no partial destination file where avoidable.
- Export does not upload original media.

## Phase 5 — Video Export Validation and Stabilization

### Objective

Offer transparent, reliable video export behavior before committing to native encoding.

### Work

- Test 30/60fps exports, multiple stages, transitions, gradients, masks, text animation, groups, motion blur, and mockups.
- Record codec/format support matrix per operating system.
- Improve cancellation cleanup and memory measurement.
- Native destination save after Blob generation.
- Add feature flags/fallback UI for unsupported native WebView codecs.

### Acceptance criteria

- Supported formats are clearly stated per platform.
- No misleading progress/success state after a failed encode.
- Cancelling an export returns Studio to a usable state.
- Large animated gradients are profiled as a documented stress case.

## Phase 6 — Optional Native Encoder

### Objective

Build only if Phase 5 measurements show that browser/WebView video export blocks a quality desktop release.

### Work

- Evaluate FFmpeg licensing/distribution obligations.
- Design a constrained Rust sidecar interface.
- Implement secure temporary-frame storage and cleanup.
- Add native encoder progress, cancellation, error mapping, and disk-space checks.
- Compare visual fidelity/frame timing/color with current web pipeline.
- Roll out behind an experimental preference/feature flag.

### Acceptance criteria

- Native export is measurably more reliable or efficient for a defined workload.
- Output quality matches approved regression fixtures.
- It passes signing/notarization and security review.
- Browser export remains as a fallback until confidence is high.

## Phase 7 — Distribution, Updates, and Beta

### Objective

Release safely to a limited beta audience before public distribution.

### Work

- Set up code signing certificates.
- Configure macOS signing/notarization.
- Configure Windows installer/signing strategy.
- Configure Tauri updater, signed manifests, and stable/beta channels.
- Create crash/error reporting policy that excludes user creative content.
- Publish install, update, uninstall, data-location, and privacy documentation.
- Establish beta feedback and support process using `support@shotage.studio`.

### Acceptance criteria

- A user can install, update, and uninstall without manual terminal work.
- Existing local projects are retained through an app update.
- Rollback procedure is tested.
- Release artifacts are reproducible through CI.

### How desktop updates work

The desktop prototype now includes the Tauri v2 updater plugin, a startup check, **Check for Updates…** in the application menu, a release-notes prompt, progress, recovery save, and relaunch. The configured endpoint is `https://github.com/bayukurniawan30/shotage-release/releases/latest/download/latest.json`. This is **not end-to-end verified** until the public release repository has a Release with a matching `latest.json` and signed platform artifacts. An earlier installed build without this updater still cannot discover a later version by itself and must be replaced manually.

Local macOS ARM64 release-build measurement (not yet notarized): `Shotage.app` uses about **23 MiB** on disk, and the signed updater archive `Shotage.app.tar.gz` is **12,044,271 bytes (about 12 MB download)**. This is not a DMG size or a Windows installer size; those must be measured separately. The desktop build excludes old generated `public/assets` web bundles, reducing its frontend payload from about 106 MiB to 11 MiB.
The local preview `.app`, updater archive, and `.sig` are kept in the Git-ignored `src-tauri/release-preview/` directory; the intermediate Rust build cache was cleared after measurement. They are test artifacts, not public installers.

A local signing key was generated at `src-tauri/.signing/shotage.key` and is Git-ignored. **Back up that private key securely before distributing any build containing its public key**, then put its contents/path in protected CI secrets (`TAURI_SIGNING_PRIVATE_KEY`). The public key is embedded in `src-tauri/tauri.conf.json`. The local private key is unencrypted, so do not commit or upload it. If it is lost after distribution, already-installed builds will not trust updates signed by a replacement key. Local packaged builds need, for example:

```sh
TAURI_SIGNING_PRIVATE_KEY=/absolute/path/to/shotage.key pnpm build:desktop
```

For a `1.0.0` → `1.0.1` release:

1. Build signed, platform-specific `1.0.1` release artifacts. Keep `package.json` and `src-tauri/tauri.conf.json` versions in sync. Tauri's `bundle.createUpdaterArtifacts: true` produces the updater bundle and its `.sig` file alongside normal installers. For example, macOS uses an `.app.tar.gz` updater bundle; Windows can use a signed NSIS or MSI installer.
2. Upload the updater bundles to a publicly reachable **HTTPS** release location. Also publish a small `latest.json` manifest containing the version, release notes, and the correct download URL and signature for each OS/architecture. A public GitHub Releases repository, or object storage/CDN such as S3/R2 behind an HTTPS domain, is sufficient; no custom update server is required. The files do **not** have to live on the Shotage web/Vercel deployment. Private storage would require a deliberate authenticated download design; public release files are the simpler starting point.
3. Publish the bundles first, verify that every URL works, then publish/update `latest.json` last. Separate stable and beta manifests/endpoints so beta users do not accidentally update stable users.
4. On startup (and via a **Check for Updates** menu item), the installed app asks the configured endpoint for the latest version. If `1.0.1` is newer, show an update prompt with notes. If the user accepts, show download progress, verify the Tauri signature, install, and relaunch. Handle offline, declined, failed download, and failed verification without losing the user's current design. Do not force-restart during editing; account for unsaved work.
5. Test an actual installed `1.0.0` updating to `1.0.1` on macOS and Windows before announcing the release. Check that local `.shotage` files, recovery drafts, app preferences, and account state survive.

The updater public key is embedded in the app; the **private signing key must remain in protected CI secrets**, never in the repository, Vite variables, or public storage. Store a secure backup: losing the key prevents signing updates for already-installed builds. macOS app signing/notarization and Windows installer signing are separate from Tauri's updater signature and still need release setup. See the [Tauri updater guide](https://v2.tauri.app/plugin/updater/) and [GitHub release pipeline example](https://v2.tauri.app/distribute/pipelines/github/).

## Quality Assurance Matrix

### Design fidelity fixtures

Maintain a small set of non-sensitive test designs that exercise:

- all main aspect ratios and custom dimensions;
- custom shapes, boolean shapes, borders, gradients, patterns, and masks;
- basic/phone/browser/code mockups;
- text with loaded Google Fonts, stretch, gradient text, character/word animation;
- groups, anchors, rotation, paths, blur, easing, and stage transitions;
- high-memory animated gradients;
- image and video export at representative sizes.

For every fixture, verify canvas screenshots and exported outputs on web, macOS desktop, and Windows desktop.

### Manual smoke test per release

- [ ] Install cleanly.
- [ ] Launch/close/relaunch restores expected window state.
- [ ] Sign in with magic link.
- [ ] Sign in with Google.
- [ ] Sign in with GitHub.
- [ ] Sign out and verify a private link is blocked.
- [ ] Open public Explore template.
- [ ] Open owned private shared design.
- [ ] Open/save/save-as local project.
- [ ] Import invalid project safely.
- [ ] Restore recovery draft.
- [ ] Export PNG at custom dimensions.
- [ ] Export supported video sample.
- [ ] Cancel export.
- [ ] Trigger credit/creator entitlement behavior.
- [ ] Open checkout externally and return/cancel.
- [ ] Check offline behavior/error messaging.
- [ ] Update app over previous installed version.

## Performance Measurements

Define realistic budgets before optimization work:

| Metric                              | Initial target                          | Notes                                           |
| ----------------------------------- | --------------------------------------- | ----------------------------------------------- |
| Cold launch to interactive Studio   | Measure first, then set platform target | Include font/runtime initialization separately  |
| Idle memory                         | Measure baseline                        | Compare with web browser tab fairly             |
| Standard design edit responsiveness | 60fps where practical                   | Test pan/zoom/selection/timeline                |
| Image export                        | No regression vs web                    | Native save should not add visible delay        |
| Video export peak memory            | Measure by fixture                      | Focus especially on animated flow gradient case |
| Recovery write latency              | Imperceptible/debounced                 | Must not interrupt canvas interaction           |

Do not make performance claims such as “native is faster” until measured on equivalent hardware and design fixtures.

## CI/CD Plan

### Pull request checks

- Typecheck;
- unit tests;
- StudioState/schema migration tests;
- project-file parser/validator tests;
- desktop adapter tests with mocked native calls;
- production web build;
- desktop build validation where CI operating systems permit it.

### Release pipeline

1. Build from a tagged commit.
2. Run tests and validate lockfile.
3. Build signed macOS and Windows artifacts in protected CI.
4. Notarize macOS artifact.
5. Generate signed updater metadata.
6. Upload artifacts to release storage.
7. Release to internal → beta → stable channels.
8. Monitor installer/update failures and export/auth regressions.

Never run release signing from a local developer machine unless a documented secure procedure requires it.

## Decisions to Make Before Coding

| Decision                 | Recommended starting position                                                     |
| ------------------------ | --------------------------------------------------------------------------------- |
| macOS support            | Apple Silicon first; universal when signing/build capacity allows                 |
| Windows support          | x64 installer first                                                               |
| Auth                     | External browser + secure deep-link callback if direct WebView flow is not proven |
| Checkout                 | External browser only                                                             |
| Local project extension  | `.shotage` JSON envelope v1                                                       |
| Autosave location        | App-private Tauri data directory                                                  |
| Cloud/local default save | Explicit user choice; do not silently sync local work                             |
| Video export             | Existing web pipeline first                                                       |
| Native FFmpeg            | Deferred, metric-driven decision                                                  |
| Linux                    | Deferred                                                                          |
| Updater                  | Beta first, signed stable rollout after validation                                |

## Risks and Mitigations

| Risk                                              | Impact                      | Mitigation                                                                               |
| ------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| macOS WebKit video capability differs from Chrome | Video export unreliable     | Test in Phase 0; expose capability-specific options/fallback                             |
| OAuth callback cannot return reliably             | Login blocked               | Use external browser + Tauri deep link + single-instance plugin                          |
| Browser auth cookies do not persist as expected   | Repeated sign-in            | Test real Neon Auth flow early; use supported token/session flow rather than assumptions |
| Large export memory usage                         | Tab/app crash               | Worker/cleanup improvements, quality limits, later native encoder                        |
| Broad filesystem permission                       | Privacy/security risk       | Dialog-selected paths and strict capability scopes                                       |
| Local and cloud save confusion                    | Data loss/user surprise     | Clear labels, dirty state, recovery UI                                                   |
| Code signing/notarization delay                   | Release blocked             | Start certificate/release research before beta end                                       |
| Native sidecar complexity                         | Maintenance/security burden | Defer until measured need is clear                                                       |
| Schema drift between web/MCP/desktop              | Designs render incorrectly  | One shared StudioState schema and compatibility fixtures                                 |

## Definition of Done for Public Desktop v1

Shotage Desktop v1 is ready for public release when:

- macOS and Windows builds install and update successfully;
- users can authenticate with the supported Shotage methods;
- existing web-created designs open correctly;
- private designs remain protected;
- local `.shotage` project save/open/recovery is reliable;
- native image export works with correct custom dimensions;
- supported video export behavior is stable and clearly communicated;
- no privileged secret is present in the release package;
- app permissions are least-privilege reviewed;
- release signing/update process is documented and tested;
- support and privacy documentation are published;
- a beta cycle has closed the highest-impact design fidelity, auth, and export issues.

## Reference Links

- [Tauri v2 overview](https://v2.tauri.app/start/)
- [Tauri capabilities and permissions](https://v2.tauri.app/security/capabilities/)
- [Tauri deep linking](https://v2.tauri.app/plugin/deep-linking/)
- [Tauri plugins and official features](https://v2.tauri.app/plugin/)
- [Tauri WebView platform versions](https://v2.tauri.app/reference/webview-versions/)
- [Shotage credit system plan](./CREDIT_SYSTEM_PLAN.md)
- [Shotage MCP setup](./MCP_SETUP.md)
