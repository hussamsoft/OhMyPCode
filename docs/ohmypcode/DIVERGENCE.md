# OhMyPCode divergence

This is the merge-conflict allowlist for upstream syncs. New OhMyPCode files are listed separately because they cannot conflict with upstream until upstream creates the same path.

## Pinned OMP runtime

`vendor/oh-my-pi` is a Git submodule from the official
`https://github.com/can1357/oh-my-pi.git` repository. Its source baseline is tag
`v18.3.1`, commit `6204b7508014bcdf12d95f0b3fd470905fd99344`. Fork changes are
kept as a focused patch on that exact source commit; generated OMP binaries are
never committed.

- `packages/coding-agent/src/vibe/mode-controller.ts` and
  `packages/coding-agent/src/vibe/runtime.ts` centralize the existing Vibe worker runtime,
  toolset transition, persisted rehydration, cleanup, and canonical snapshots. After the
  v18.3.1 rebase this controller is also where upstream's session-switch behaviour lives:
  `VibeModeController.reconcileSession` owns the owner-scope match (`preserveVibe`), the
  `previousTools` snapshot used when the toolset was lost to teardown, and the rehydrate
  step, so the TUI and RPC paths share one implementation.
- `packages/coding-agent/src/vibe/tool-catalog.ts` owns native, host, and MCP catalog
  projection and live selection filtering.
- `packages/coding-agent/src/modes/interactive-mode.ts` calls the shared Vibe controller; it does
  not own a second Vibe transition implementation. It exposes `vibeModeEnabled` as a mirror of
  the controller: the getter reads `VibeModeController.isEnabled` and the setter calls
  `VibeModeController.adopt()`, which flips the state flags inline. A synchronous setter cannot
  drive the async entry, so a direct assignment is a state assertion, not a transition;
  `enter()` and `exit()` remain the only paths that swap tools and journal a mode change.
  Without the mirror the controller can still believe it is enabled, and the next `/vibe`
  takes the already-enabled fast path in `#enterLocked` and never re-runs the entry.
- `packages/coding-agent/src/modes/rpc/rpc-types.ts`, `rpc-mode.ts`, and `rpc-client.ts` expose
  the Vibe commands/results/events and tool-catalog commands. v18.3.1 added the message
  lifecycle `messageId` framing upstream, so `RpcSessionEventFrame` now unions the fork's
  `RpcVibeFrame` with upstream's `RpcAgentSessionEventFrame`.
- `packages/coding-agent/src/config/all-settings.ts` is the settings surface of record. Upstream
  replaced the old static `config/settings-schema.ts` object with a runtime registry, so
  `scripts/generate-omp-control-surface.mjs` now AST-scans every module importing
  `config/registry` for `register({ id, type, ui })` calls. The generated surface must stay
  at 512 settings / 384 with UI metadata.
- `packages/coding-agent/test/interactive-mode-vibe-toggle.test.ts`,
  `rpc-vibe.test.ts`, `rpc-tool-catalog.test.ts`, and `vibe/mode-controller.test.ts`
  protect the fork contracts. `mode-controller.test.ts` covers a same-owner vibe switch
  (preserved) and a different-owner switch (torn down and restored).

When rebasing OMP, replay this group together and rerun the focused commands in
[UPSTREAM.md](UPSTREAM.md).

## Edited upstream files

The OMP submodule's own fork group is listed under "Pinned OMP runtime" above. The list
below is the OhMyPCode fork's edits to the Paseo-derived tree, as of the v18.3.1 rebase:

- `packages/server/src/services/omp-command.ts`, `scripts/build-omp-runtime.mjs`, and `ohmypcode/runtime/omp/<target>/manifest.json` — resolve the OMP TUI terminal through `resolveOmpTerminalSpawn`, probe runtime availability with `isOmpRuntimeAvailable`, and fail packaging when the manifest's target, SHA-256, or `sourceCommit` disagrees with `vendor/oh-my-pi` HEAD. The build script also clears `RUSTC_WRAPPER` for the native step: sccache on Windows dies with `os error 206` on long rustc argument lists.
- `packages/server/src/server/websocket-server.ts` — publish `ompCollab`, `ompVibe`, and `ompToolSelection` together from the single `ompRuntimeAvailable` probe, so a host that cannot spawn `omp` claims none of them.
- `packages/app/src/hooks/use-draft-agent-tools.ts` and `packages/app/src/composer/draft/input-draft.ts` — compute the tool `rows` from the saved `allowedTools` in the hook, so the Tools sheet shows the user's selection and never falls back to host defaults.
- `packages/app/src/components/headers/header-toggle-button.tsx`, `packages/app/src/components/ui/icon-button-chrome.ts`, and `packages/app/src/composer/omp-control-deck/control-chip.tsx` — keep a disabled control's reason reachable: the tooltip trigger is not passed `disabled` (so hover still explains), the hover highlight is suppressed, and `aria-disabled` is set on the trigger itself.
- `scripts/generate-omp-control-surface.mjs`, `scripts/generate-omp-parity-doc.mjs`, and `packages/app/src/omp-parity/manifest.ts` — the machine-checked parity contract. The manifest is hand-owned; the generators only publish it, and every extractor fails closed so a surface cannot silently read as empty.
- `docs/omp/CONTROL-SURFACE.md`, `docs/omp/PARITY.md`, and `docs/omp/APP-ARCHITECTURE.md` — generated and hand-written blueprints kept in the same commit as the surfaces they describe.

The remaining groups are unchanged from before the rebase:

- `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `scripts/sync-workspace-versions.mjs`, and `nix/desktop-package.nix` — rename the desktop workspace and preserve fork metadata in manifests, CI, Nix, and version syncing.
- `docs/browser-capture-harness.md`, `docs/development.md`, and `docs/testing.md` — use the OhMyPCode desktop workspace in contributor and verification commands.
- `packages/protocol/src/provider-manifest.ts` and `packages/server/src/server/agent/provider-registry.test.ts` — make OMP the product's default provider and cover that default.
- `packages/protocol/src/messages.test.ts` and `packages/protocol/src/messages.ts` — add OMP statistics and collaboration RPC contracts, capability metadata, and validation.
- `packages/client/src/daemon-client.ts` and `packages/client/src/daemon-client.test.ts` — expose correlated OMP statistics and collaboration client calls.
- `packages/server/src/server/authorization/operation-permissions.ts` — authorize the OMP statistics and collaboration operations.
- `packages/server/src/server/session.ts`, `packages/server/src/server/session.test.ts`, and `packages/server/src/server/websocket-server.ts` — wire OMP statistics/collaboration services, capabilities, routing, and redacted failures.
- `packages/server/src/server/agent/agent-manager.ts`, `agent-sdk-types.ts`, `providers/omp/agent.ts`, `providers/omp/agent.test.ts`, `providers/omp/cli-runtime.ts`, `providers/omp/cli-runtime.test.ts`, `providers/omp/rpc-types.ts`, and `providers/omp/runtime.ts` — integrate OMP session lifecycle, fast mode, titles, RPCs, and compatibility behavior.
- `packages/server/src/server/agent/providers/omp/todo-mapper.ts` and `todo-mapper.test.ts` — map OMP todo state into the shared agent model.
- `packages/server/src/server/session/provider/provider-catalog-session.ts` and `provider-catalog-session.test.ts` — expose OMP provider metadata and catalog behavior.
- `packages/server/src/server/agent/providers/omp/test-utils/fake-omp.ts` and `test-utils/omp-harness.ts` — extend OMP test fixtures for the supported lifecycle and RPC surface.
- `packages/server/src/services/quota-fetcher/manifest.ts`, `provider.ts`, `service.ts`, and `service.test.ts` — add quota-fetching integration and safe provider error handling.
- `packages/app/app.config.js`, `src/app/_layout.tsx`, `src/components/left-sidebar.tsx`, `src/components/sidebar/sidebar-help-menu.tsx`, `src/components/sidebar/sidebar-nav-rows.tsx`, and `src/diagnostics/app-diagnostic-report.ts` — apply product identity, navigation, and diagnostics changes.
- `packages/app/src/i18n/resources/{ar,en,es,fr,ja,ko,pt-BR,ru,zh-CN}.ts` — add translated OMP usage and collaboration strings.
- `packages/app/src/screens/settings/host-page.tsx` — add the OMP host/settings surface.
- `packages/app/src/screens/workspace/terminals/use-workspace-terminals.ts` — integrate live terminal state with workspace behavior.
- `packages/app/src/styles/theme.ts` and `theme.test.ts` — add and cover product theme tokens.
- `packages/app/src/utils/host-routes.ts` — route OMP host and collaboration endpoints safely.
- `packages/cli/bin/paseo` — point the CLI shim at the OhMyPCode product.
- `packages/desktop/src/main.ts`, `src/daemon/daemon-manager.ts`, `src/integrations/cli-install/install.ts`, `src/integrations/cli-install/paths.ts`, `electron-builder.yml`, and `package.json` — apply desktop identity, first-run defaults, CLI installation, and packaging metadata.
- `packages/desktop/scripts/dev-runner-config.mjs`, `dev-runner-config.test.mjs`, `dev-runner.mjs`, and `dev.ps1` — make the Windows development launcher resolve the fork's desktop and daemon configuration.
- `packages/server/src/services/quota-fetcher/providers/omp.ts` and `providers/omp.test.ts` — add OMP quota provider behavior.
- `packages/server/src/terminal/agent-hooks/provider-registry.ts`, `provider-registry.test.ts`, `terminal-agent-hook-setting.test.ts`, and `packages/cli/src/commands/hooks.test.ts` — register the OMP terminal activity hook provider and cover its installation and activity mapping.

## Custom UI and brand groups

Keep these groups together during upstream syncs; they describe the completed custom shell
and packaging work rather than isolated styling changes:

- **Official OMP assets and attribution** — `ohmypcode/assets/desktop/icon.svg` is the
  unchanged OMP v18.2.10 artwork, with `icon.png`, `icon.ico`, and `icon.icns` as
  derived desktop outputs and `OMP-ICON-LICENSE.txt` carrying attribution. Regenerate
  the raster/icon-container outputs from the 1024px PNG with the installed
  `app-builder-bin` icon pipeline; do not hand-assemble ICNS chunks or replace the
  attribution.
- **OMP palette and default desktop theme** — `packages/app/src/styles/theme.ts`,
  `theme.test.ts`, `packages/app/src/constants/product.ts`, and
  `packages/app/src/app/_layout.tsx` preserve the OMP palette (`#fafafa`, `#0d0d0d`,
  `#f97316`) and default desktop appearance.
- **Fixed navigation rail and responsive modes** —
  `packages/app/src/components/sidebar/desktop-navigation-rail.tsx`,
  `left-sidebar.tsx`, `sidebar-nav-rows.tsx`, and related sidebar projection/label files
  preserve the fixed desktop rail, compact/responsive modes, and navigation affordances.
- **Workspace action strip and secure routing** —
  `packages/app/src/components/sidebar/omp-workspace-action-strip.tsx`,
  `packages/app/src/omp-collab/{actions,model,settings-section}.ts(x)`, and
  `packages/app/src/utils/{host-routes,host-route-browser}.ts` preserve the workspace
  actions, host routing boundaries, and explicit-intent requirements for link/share
  operations.
- **Translated labels** — `packages/app/src/i18n/resources/{ar,en,es,fr,ja,ko,pt-BR,ru,zh-CN}.ts`
  preserve translated product, navigation, workspace-action, and collaboration labels;
  do not replace them with hard-coded English strings.
- **Windows development runner path fix** —
  `packages/desktop/scripts/{dev-runner-config.mjs,dev-runner.mjs,dev.ps1}` and their
  tests preserve resolution of the fork's desktop and daemon paths on Windows.
- **Package and icon configuration** — `packages/desktop/electron-builder.yml`,
  `packages/desktop/package.json`, and `packages/desktop/src/product-bootstrap.ts`
  preserve the OhMyPCode identity, protocol, platform icon paths, resource inclusion, and
  non-publishing directory-build verification path.

## OhMyPCode-owned files

- `packages/desktop/src/product-bootstrap.ts` and `packages/app/src/constants/product.ts` — centralize fork product identity and bootstrap defaults.
- `packages/app/src/app/usage.tsx` and `packages/app/src/screens/usage-screen.tsx` — add the usage screen.
- `packages/app/src/omp-statistics/use-omp-statistics.ts` — add client state for OMP usage statistics.
- `packages/app/src/omp-collab/actions.ts`, `actions.test.ts`, `model.ts`, and `settings-section.tsx` — add the safe collaboration host/list/link/share UI and state.
- `packages/app/src/components/sidebar/sidebar-live-terminals.tsx` and `src/screens/workspace/terminals/use-workspace-terminal-list.ts` — add live terminal navigation and list state.
- `packages/server/src/server/agent/providers/omp/feature-definitions.ts` — define the supported OMP fast-mode feature.
- `packages/server/src/services/omp-statistics/service.ts` and `service.test.ts` — implement and test OMP statistics collection.
- `packages/server/src/services/omp-collab/index.ts` and `index.test.ts` — implement and test safe OMP host listing, link creation, and session sharing.
- `packages/server/src/terminal/agent-hooks/omp/*` — implement and test OMP terminal activity hook installation and reporting.
- `ohmypcode/default-config.json` and `ohmypcode/assets/` — hold fork-only defaults and product assets.
- `docs/ohmypcode/` — hold fork sync, compatibility, and divergence documentation.

Keep this list current in the same commit as each new upstream-file edit.
