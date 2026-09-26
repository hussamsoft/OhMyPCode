# Upstream and OMP compatibility

OhMyPCode follows the upstream Paseo release line while carrying a fork-specific product
identity and OMP integration.

## OMP 18.3.1 compatibility

- The runtime source is the `vendor/oh-my-pi` Git submodule from the official
  `https://github.com/can1357/oh-my-pi.git` repository.
- The compatibility baseline is tag `v18.3.1`, commit
  `6204b7508014bcdf12d95f0b3fd470905fd99344`. The installed `omp` binary reports
  `omp/18.3.1`, so the runtime this app validates against is the one it ships.
- The fork commit on top of that baseline is
  `5fc857c255c31cc3876f1cc7e94473b2aaa6d3c6` ("feat(coding-agent): add shared vibe controls
  and tool catalog"), replayed from
  the v18.2.11 fork commit `b65b7c30c7`, which is kept reachable on the local branch
  `ohmypcode/fork-v18.2.11`.
- Upstream v18.3.1 supports session lifecycle, title updates, `fast_mode`, host tools,
  and subagent RPC. This fork adds the Vibe and tool-catalog contracts listed in
  [DIVERGENCE.md](DIVERGENCE.md); those capabilities require the pinned fork runtime.
- `omp collab list --json` is safe, read-only host discovery.
- `omp collab link` creates a control link. Treat it as an external side effect and require
  explicit user intent before invoking it; never log the generated link.
- `omp share` publishes a session, with optional gist publication. Treat it as an external
  publication and require explicit user intent before invoking it; never log the generated
  link or session contents.

## Custom shell and packaging contracts

The following fork behavior is intentional and must survive rebases even when upstream
touches nearby components:

- Preserve the official OMP v18.2.10 desktop artwork and `OMP-ICON-LICENSE.txt`. The
  canonical source is `ohmypcode/assets/desktop/icon.svg`; `icon.png`, `icon.ico`, and
  `icon.icns` are derived outputs. Rebuild container formats with the installed
  `app-builder-bin` icon command from the 1024px PNG; never hand-edit ICNS data.
- Preserve the OMP palette/default desktop theme in `packages/app/src/styles/theme.ts`
  and product bootstrap defaults. The branded colors are `#fafafa`, `#0d0d0d`, and
  `#f97316`.
- Preserve the fixed desktop navigation rail and its compact/responsive modes, plus the
  workspace action strip. Keep host routing constrained by `host-routes` and retain
  explicit user intent before creating collaboration links or publishing shares.
- Preserve translated labels across all OMP resource files; UI strings must continue to
  flow through i18n rather than being replaced with English literals.
- Preserve the Windows dev-runner path resolution in
  `packages/desktop/scripts/dev-runner-config.mjs`, `dev-runner.mjs`, and `dev.ps1`.
- Preserve desktop package/icon configuration in `packages/desktop/electron-builder.yml`
  and the OhMyPCode package/bootstrap metadata. Verify with a Windows `--dir
--publish never` build; do not publish during rebase verification.

When resolving conflicts, treat the shell files and contracts above as a unit. Update
the file lists in [DIVERGENCE.md](DIVERGENCE.md) if upstream moves any of these paths.

## Sync a release

1. Choose the official OMP `vX.Y.Z` tag and resolve its commit with `git ls-remote
https://github.com/can1357/oh-my-pi.git refs/tags/vX.Y.Z`.
2. Check out that exact commit in `vendor/oh-my-pi`, then replay only the runtime divergence listed
   in [DIVERGENCE.md](DIVERGENCE.md).
3. Update the gitlink and the exact source commit in this document.
4. Install the pinned OMP dependencies and run the focused Vibe/RPC tests plus the
   coding-agent typecheck before accepting the new baseline.
5. Keep the supported and unsupported RPC facts above in sync with the installed fork. Do not
   bump unrelated root package versions.

## Final verification

Run the narrow checks for changed packages first, then the repository checks:

1. Build the protocol package so generated validators are current.
2. Run focused protocol, client, server, and OMP service tests.
3. Run workspace typechecks, scoped lint, and formatting checks.
4. On Windows, launch the development daemon with `npm run dev:win:desktop` and verify the
   desktop development path reaches the daemon without manually substituting paths.
5. Run only the safe OMP smoke command, `omp collab list --json`. Do not run link or share
   commands as part of unattended verification.
6. Stop the launcher/daemon after the smoke check and remove only isolated verification
   artifacts created by this effort. Keep unrelated user files and processes untouched.
