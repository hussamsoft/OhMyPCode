# OhMyPCode Application Architecture

Hand-written architecture blueprint and component inventory for OhMyPCode desktop. Documents both the **Current Tree State** (Phase 1 baseline) and the **Target Rebuild State** (Phases 5–10).

## 1. Route Tree

### Current Tree State

- `/` — Bootstrap and redirection.
- `/h/[serverId]/` — Server workspace launchpad.
- `/h/[serverId]/workspace/[workspaceId]/` — Active workspace screen (`workspace-screen.tsx`, 4,288 lines).
- `/h/[serverId]/settings` — Settings root.
- `/h/[serverId]/settings/hosts/[serverId]/collaboration` — OMP session collaboration and remote pairing.
- `/usage` — Standalone session token and cost statistics screen (`packages/app/src/app/usage.tsx`).
- Legacy multi-host and mobile routes remain in tree (`/pair-scan`, `/schedules`, mobile gestures).

### Target Rebuild State (Phase 5 Cutover)

OhMyPCode becomes a desktop-only single-host application. All routes follow `/h/[serverId]/*` to retain deep-link stability while eliminating multi-host switching:

- `/` — Bootstrap and direct redirection to the local daemon workspace.
- `/h/[serverId]/` — Primary workspace canvas.
- `/h/[serverId]/settings` — Full generated settings form driven by OMP `SETTINGS_SCHEMA`.
- `/h/[serverId]/settings/appearance` — OMP theme configuration (`omp-dark`, `omp-light`, typography, contrast).
- `/h/[serverId]/settings/keybindings` — Keybindings configuration mapped to OMP actions.
- `/h/[serverId]/settings/collaboration` — OMP session collaboration, link sharing, and remote host pairing.
- `/h/[serverId]/usage` — Direct host-scoped usage statistics.
- Legacy mobile and multi-host routes deleted.

## 2. Desktop Shell & Responsive Breakpoints

### Current Tree State

- Rail currently has ten buttons (`desktop-navigation-rail.tsx:404-505`).
- Workspace header contains redundant action strip (`omp-action-strip-tui`, `omp-action-strip-collab`).
- Width thresholds live in `packages/app/src/components/desktop-sidebar-layout.ts:27-42`:
  - `rail-context` (≥1100px): Rail + Context Column + Workspace Canvas.
  - `rail-only` (720px – 1099px): Rail + Workspace Canvas.
  - `compact` (<720px): Rail collapses into compact mode.

### Target Rebuild State (Phases 7 & 8)

- **56px Navigation Rail**:
  - Exactly seven OMP buttons: New workspace, Sessions, Vibe team, Providers, Usage, Plugins, Settings.
- **Single 44px Title/Tab Strip**:
  - Unifies window drag region, workspace title, branch indicator, open tabs, and action icons.
  - Redundant secondary action strip deleted; TUI moved to terminal menu, collaboration to settings.

## 3. Panel Registry

### Current Tree State

- Only `omp_vibe` is registered among OMP-specific panels (`resourceKey: ompVibe:<agentId>`).
- Fallback escape hatch for all other surfaces is `terminal:omp-tui`.

### Target Rebuild State (Phases 8 & 10)

Registered in `packages/app/src/panels/register-panels.ts` and `panel-manifest.ts`:

- `omp_vibe`: Embedded Vibe director and worker lifecycle panel.
- `omp_todo`: Real-time task and phase tracker driven by `set_todos` mapping.
- `omp_goal`: Guided goal editor and criteria tracker from `/goal` and `/guided-goal`.
- `omp_loop`: Bounds, evaluation loop, and condition gates from `/loop`.
- `omp_settings`: Native generated settings form driven by OMP `SETTINGS_SCHEMA`.
- `omp_skills`: Skills catalog, discovery, installation, and inspection from `/skills`.
- `omp_mcp`: MCP servers, capabilities, resources, and tool inspector from `/mcp`.
- `omp_extensions`: Extension control center and plugin marketplace.
- `omp_plugins`: OMP plugin manager and runtime reload trigger.
- `omp_sessions`: Session tree, fork, branch, checkpoint, and history manager.
- `omp_agents_hub`: Multi-agent configuration and subagent inspector.
- `omp_git`: Split diff viewer, staging area, and commit generator.
- `omp_context`: Token breakdown, prompt cache allocation, and memory analyzer.
- `omp_keybindings`: Interactive keybinding editor with live conflict detection.
- `omp_hook_widget`: Dynamic widget canvas for extensions responding to `extension_ui_request`.

## 4. Composer Control Deck

### Current Tree State

- `packages/app/src/composer/omp-control-deck/index.tsx` renders OmpControlDeck alongside legacy multi-provider controls.
- Tools chip renders live count or preserved saved tools count with reason.
- Access control maps to `tools.approvalMode`.
- Modes currently expose only Build and Vibe toggle.

### Target Rebuild State (Phase 9)

- Legacy multi-provider `AgentControls` deleted; `OmpControlDeck` is the only control surface.
- Full 5-segment mode control: `[Build | Plan | Vibe | Goal | Loop]` backed by `getOmpModes` / `setOmpMode`.
- Roles section in Model browser (Default, Smol, Slow, Plan).
- Discrete thinking levels (`off`, `low`, `medium`, `high`, `extended`) matching OMP tokens.
- Live `/` slash palette querying OMP builtin slash commands.
- Input triggers: `!` bash, `!!` bash-excluded, `$` python, `$$` python-excluded, `#` prompt actions, `#<number>` GitHub issue/PR, `@file` attachment.

## 5. Store Layer

- `SessionStore` (`packages/app/src/stores/session-store.ts`): Client session state, agent definitions, turn telemetry, and server capabilities.
- `WorkspaceLayoutStore` (`packages/app/src/stores/workspace-layout-storage.ts`): Persisted tab placement, split pane layouts, and active panel targets.
- `OmpVibeStore` (`packages/app/src/omp-vibe/store.ts`): Active Vibe workers, director status, worker metrics, and selected worker focus.
- Central Keyboard Dispatcher: Application-wide shortcut handling without window-global pollution.

## 6. OMP Integration Surface

- **RPC Parity**: Drives the bundled OMP CLI runtime via JSON-RPC (`--mode rpc`).
- **Terminal Escape Hatch**: Complete fallback via embedded workspace terminal profile (`{ id: "omp", command: "omp" }`) resolved to the bundled binary via `resolveOmpTerminalSpawn`.
- **Feature Probing**: Daemon probes `isOmpRuntimeAvailable()` and advertises `ompRuntime`, `ompCollab`, `ompVibe`, and `ompToolSelection` in `server_info.features`.
- **Protocol Gateway**: Correlated protocol request/response pairs in `@getpaseo/protocol` routed through `OmpParitySessionController`.

## 7. Branding Surface

- Single product identity module: `packages/app/src/constants/product.ts`.
- Product name: **OhMyPCode**.
- Product tagline: **OMP for your desktop**.
- Product scheme: `ohmypcode://`.
- Zero Paseo butterfly or branding assets; single mark is `OmpLogo`.
- About dialog states OhMyPCode version, bundled OMP runtime version, and OMP source commit.

## 8. Design System

- **Tokens Source**: Generated by `scripts/generate-omp-theme-tokens.mjs` directly from `vendor/oh-my-pi/packages/tui/src/theme/dark.json` and `light.json`.
- **Registered Themes**: Exclusively `omp-dark` and `omp-light`.
- **Symbols**: Generated from `vendor/oh-my-pi/packages/tui/src/theme/symbols.ts` for unicode and reduced-motion ASCII presets.
- **Typography & Interaction**:
  - High-density monospace and sans-serif alignment rails.
  - Hairline borders (`border`, `borderMuted`, `borderAccent`).
  - Standard 2px focus ring (`ring`).
  - Minimum touch/click hitboxes (≥32px icon controls, ≥44px compact touch targets).

## 9. Test Surface

- **Unit & Component Testing**: Vitest with jsdom environment covering decks, sheets, hooks, stores, and utilities.
- **Parity Manifest Verification**: `packages/app/src/omp-parity/manifest.test.ts` ensuring 100% coverage of OMP CLI flags, commands, slash commands, tools, modes, settings, keybindings, segments, and overlays against the machine-checked control surface inventory.
- **End-to-End Testing**: Playwright browser and packaged Electron automation covering workspace lifecycle, Vibe director, slash palette, and responsive modes.
- **CI Quality Gate**: Windows and Linux matrix enforcing `npm run typecheck`, `npm run lint`, `npm run parity:check`, and focused test suites.
