# OhMyPCode checkpoint — 2026-09-27 (Phase 11 landed; Phase 12 deferred)

## Resume point

Picked up the phased OMP-parity desktop rebuild from `.omp/CHECKPOINT.md`
with the request "resume the phased plan, defer any user gates to very
last." Per `.omp/plans/OMP_DESKTOP_MASTER_PLAN.md`:

- Phases 0–4: verified-done before this session.
- Phases 5–10: largely done through recent Phase 10 screen registrations
  (commits `19cb7fe55` omp_agents_hub, `76a8e3e39` omp_skills,
  `01dab9156` omp_plugins, `76a8e3e39` omp_skills, `884096c7c` omp_ssh,
  `46c2e07e3` omp_mcp, `5a3ed879d` omp_context, `2c240db95` omp_keybindings,
  `5ccc20f26` omp_settings, `baa4f53bf` omp_goal+loop). Persistent chrome,
  mode badge, todo rail, status bar components, and the generated OMP
  settings form already landed.
- Phase 11 (this session): landed.
- Phase 12: **deferred** — user gates. Tooling/setup ready; the user drives.

## Phase 11 — Robustness and soundness gate (verified this session)

- `npm run typecheck` — green across all 9 workspaces (highlight, plugin,
  protocol, client, server, app, relay, website, desktop, cli).
- `npm run lint` — 0 warnings, 0 errors on 4,438 files.
- `npm run format:check` — clean (single-threaded; parallel `--check` has
  a known oxfmt race that reports false positives on Windows). The single
  `--threads 1` invocation finishes in ~6.8 s on 4,704 files.
- `npm run parity:check` — green: `docs/omp/CONTROL-SURFACE.md` and
  `docs/omp/PARITY.md` (866 rows) are up to date and match the manifest.
- `npm run ensure:omp-runtime` — clean. SHA-256 of `omp.exe` matches the
  manifest, `ompVersion: 18.3.1`, `sourceCommit: ffa50151f1` matches
  `vendor/oh-my-pi` HEAD.
- `./ohmypcode/runtime/omp/win32-x64/omp.exe --version` prints `omp/18.3.1`.
- `npx vitest run packages/app/src/omp-parity/manifest.test.ts` — 9/9
  pass. Capability-gate completeness and COMPAT lifecycle audits are
  already wired in commit `933db7f90`. RPC rows without a capability
  must document a gate (terminal fallback / slash palette / capability
  name) — verified by mutation.
- `npx vitest --root packages/server run packages/server/src/session.test.ts
-t "omp parity"` — 5/5 pass (148 unrelated skipped).
- `npx vitest --root packages/client run packages/client/src/daemon-client.test.ts
-t "OMP parity actions"` — 1/1 pass (143 unrelated skipped).
- `npm run test --workspace=@ohmypcode/app` — 5,712 pass / 1 fail. The
  one failure is `svg-root-transform.test.ts` "still converts a real SVG
  transform string" timing out at 5 s when run as part of the full suite;
  the same test passes individually (`npx vitest run src/components/
svg-root-transform.test.ts --bail=1` — 15/15 in 1.7 s). Pre-existing
  contention flake, not a regression from this session.
- `npx vitest run packages/protocol/src/messages.test.ts` — 35/35 pass.
- Negative check (Phase 11 §11): a fake `guiHome: ""` row makes
  `manifest.test.ts > "has non-empty entries and unique IDs"` fail at the
  `id === surface:name` assertion; restored after the negative test.

## Phase 11 rot fixed this session

`commit 0ebfee502 fix(omp): drop filePath from the agents-list wire payload`
removed `filePath` from `OmpAvailableAgentPayloadSchema` and
`OmpAvailableAgentCatalogEntrySchema`, with a commit message claiming
"host renderers that referenced filePath (none in this repo, confirmed
via grep) need no changes." That grep claim was wrong:

- `packages/app/src/omp-agents-hub/omp-agents-hub-form.tsx` line 263 still
  read `agent.filePath` and line 283-285 rendered it as a "Path: …" meta
  line.
- `packages/app/src/omp-agents-hub/omp-agents-hub-form.test.tsx` lines
  229 and 241 supplied `filePath` keys in two of three catalog fixtures.
- `packages/app/src/i18n/resources/en.ts` line 2146 carried the
  `panels.ompAgentsHub.catalog.filePathLabel: "Path"` key the row used.

`tsgo --noEmit` failed all four files with
`error TS2353: Object literal may only specify known properties, and
'filePath' does not exist in type ...`. Three coordinated drops landed in
`e9b948fda fix(app): drop filePath UI from omp-agents-hub catalog rows`:

1. Remove `filePath` read and the meta row from `CatalogRow`.
2. Drop `filePath` keys from the two test fixtures (project-zeta,
   user-beta).
3. Drop the now-unreferenced `filePathLabel` i18n string.

Verified: `vitest run src/omp-agents-hub/omp-agents-hub-form.test.tsx`
runs 10/10 pass via the workspace vitest setup (the file's matchMedia
shim lives in `packages/app/vitest.setup.ts:11-12`; running from the
root with `npx vitest run` does not pick that up, which is why direct
invocations need `--root packages/app`).

## Phase 11 rot NOT fixed (acknowledged, out of scope for this session)

- **`npm run knip` exits 1** with 46 unused files, 30 unused exports,
  10 duplicate exports, 36 configuration hints. Per
  `.omp/knip-baseline-2026-09-26.txt` the baseline already showed
  528 unused exports + 1,280 unused exported types + 44 unused files +
  10 unused deps + 31 unlisted deps + 6 unresolved imports — ~1,800
  individual findings requiring per-case verification against false
  positives (dynamic imports, reflection, string-based lookups). The
  baseline explicitly noted "not something this session attempted to
  clear". CI does not gate on knip (no `npm run knip` in
  `.github/workflows/ci.yml`). Deferred.
- **`.transform()`, `.catch()`, `.preprocess()` on WS message schemas**
  per `docs/protocol-validation.md` — there are still several in
  `packages/protocol/src/messages.ts` (lines 1140, 1206, 3938, 3946,
  3957, 4175, 4312, 4327, 4342, 4409, 4483, 4508, 4870, 4880, 5763,
  6130, 6191, 7066). Pre-existing rot, not introduced by this session.
  Migrating to consumer-side normalization is a substantial refactor
  outside the scope of a Phase 11 soundness sweep.
- **`paseo.json` → `ohmypcode.json`** (Phase 5 deferred bullet):
  per-project file with a "Commit paseo.json changes" UI flow built
  around that filename; needs a real compat-strategy decision the plan
  text gestures at but does not specify.
- **Daemon `PASEO_*` → `OMPCODE_*`** (Phase 5 deferred bullet): a
  stock `paseo` CLI is a separate process that only ever reads
  `PASEO_*`, so the dual-write window for `~/.omp/agent/config.yml`
  child-process environments is a real product-decision length, not a
  mechanical rename. `paseoEnv` COMPAT tag retained in
  `packages/server/src/server/config-environment.ts:71`.
- **IndexedDB / SQLite database renames** (Phase 5 deferred bullet):
  no rename primitive — needs open-both/copy/delete. Different
  technical shape. Out of scope.
- **OMP theme tokens generator** (Phase 7): the
  `scripts/generate-omp-theme-tokens.mjs` script exists at
  `scripts/generate-omp-theme-tokens.mjs` and the npm script is wired
  (`generate:omp-theme`, `generate:omp-theme:check`), but the
  generated `packages/app/src/omp-theme/tokens.generated.ts` and the
  `omp-dark`/`omp-light` `REGISTERED_THEMES` cleanup have not landed.
  `REGISTERED_THEMES` still carries the nine Paseo themes.
- **PACKAGED BUILD is stale.** The packaged
  `packages/desktop/release/win-unpacked/OhMyPCode.exe` exists, but
  the bundled OMP runtime is from `sourceCommit c7700d7b` (older fork),
  while the local tree is at `ffa50151f1`. Phase 12 requires
  `npm run build:desktop -- --publish never --win --x64 --dir` before
  each pass, which will rebuild with the current runtime. No work
  required this session.

## Phase 12 — user-driven QA passes (DEFERRED per user instruction)

User instruction: "defer any user gates to very last". Phase 12
(`.omp/plans/OMP_DESKTOP_MASTER_PLAN.md` Phase 12) is entirely
user-driven — five passes, each ending with a rebuilt + relaunched
desktop, fresh screenshots, recorded verdicts.

### Tooling ready

- `npm run dev:win:desktop` — watches the desktop bundle with
  `PASEO_WEB_PLATFORM=electron`.
- `npm run build:desktop -- --publish never --win --x64 --dir` —
  produces `packages/desktop/release/win-unpacked/OhMyPCode.exe` with
  the current OMP runtime embedded under `resources/omp/win32-x64/`.
- `ohmypcode/runtime/omp/win32-x64/omp.exe` — the launchable OMP TUI
  escape hatch, always available via the terminal overflow menu's
  permanent "Open OMP TUI" entry (commit `db62bbc41`).
- `npx playwright test e2e/browser/omp-desktop-ui.spec.ts
--project=browser` from `packages/app` with regenerated baselines —
  the visual-regression harness.

### Five passes to drive, in order

1. **Brand and shell pass** — window/taskbar/alt-tab mark, About rows
   (three: OhMyPCode, OMP runtime, OMP source), startup splash, home
   surface, rail icon set, light and dark themes side by side.
2. **Composer and controls pass** — every deck control in every state
   (default/selected/on/off/disabled-with-reason/pending/busy/error),
   the settings sheet, the Tools sheet, the slash palette.
3. **Workspace and modes pass** — title strip, tabs, panes, status bar
   segments and preset switch, TodoRail, Vibe panel and worker
   lifecycle, focus mode, three responsive modes at 1200×800,
   900×600, 751×700, 640×800.
4. **Full parity sweep** — walk `docs/omp/PARITY.md` (866 rows) row by
   row with the user: every surface group, marking each PASS / FAIL /
   MISSING.
5. **Polish pass** — typography, density, alignment rails, motion,
   empty states, error copy, reduced-motion and keyboard-only paths.

Per pass: run `npm run dev:win:desktop` OR launch
`packages/desktop/release/win-unpacked/OhMyPCode.exe` after
`npm run build:desktop -- --publish never --win --x64 --dir`, drive it
with the `computer` eval helpers against the real Electron window,
capture screenshots, present a numbered checklist with the exact
clicks and expected results, record the user's verdicts into the
manifest, fix, and rebuild.

**Never restart the daemon on port 6767; use 6799 for isolation.**

## Two commits this session

- `e9b948fda fix(app): drop filePath UI from omp-agents-hub catalog rows`
  — Phase 11 rot fix (3 files, 9 deletions).
- `644e941d0 docs(omp): regenerate PARITY.md after Phase 10 keybinding remap`
  — `docs/omp/PARITY.md` regen (1 file, 98 insertions, 98 deletions:
  864 → 866 rows after the keybinding guiHome remap to `omp_keybindings`
  and the two genuinely-new OMP capabilities `open_session` and
  `set_event_filter`).
