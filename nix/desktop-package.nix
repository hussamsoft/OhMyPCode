{
  lib,
  stdenv,
  buildNpmPackage,
  nodejs_22,
  python3,
  makeWrapper,
  autoPatchelfHook,
  copyDesktopItems,
  makeDesktopItem,
  electron,
  libuv,
  bun,
  buildVersion,
  # Reuse the daemon's prebuilt npm-deps FOD. Same lockfile, same content —
  # without this, the desktop drv produces a separately-named store path
  # (`paseo-desktop-<v>-npm-deps`) and refetches the entire registry. Override
  # the upstream hash via `paseo.override { npmDepsHash = "..."; }`.
  ompSource,
}:
let
  runtimePlatform = if stdenv.hostPlatform.isWindows then "windows" else if stdenv.hostPlatform.isDarwin then "darwin" else "linux";
  runtimeArch = if stdenv.hostPlatform.isx86_64 then "x64" else if stdenv.hostPlatform.isaarch64 then "arm64" else stdenv.hostPlatform.parsedPlatform.cpu;
in
  # Keep the Nix derivation hermetic: Bun is an explicit input, and the source
  # includes the pinned vendor/oh-my-pi checkout. Runtime binaries are generated
  # during the build and are never checked into the source tree.
buildNpmPackage {
  pname = "ohmypcode-desktop";
  version = (builtins.fromJSON (builtins.readFile ../package.json)).version;

  src = lib.cleanSourceWith {
    src = ./..;
    filter = path: type:
      let
        baseName = builtins.baseNameOf path;
        relPath = lib.removePrefix (toString ./..) path;
      in
      # The pinned vendor/oh-my-pi submodule is required by the runtime builder.
      !(lib.hasPrefix "/packages/app/android" relPath)
      && !(lib.hasPrefix "/packages/app/ios" relPath)
      # Website is unrelated to the desktop app
      && !(lib.hasPrefix "/packages/website" relPath)
      # Documentation, CI definitions and agent/editor configuration. None of
      # these reach the build, but every one of them is part of `src`, so a
      # docs-only or workflow-only commit currently invalidates the whole
      # desktop derivation and pays for a full Expo export to produce a
      # byte-identical result.
      && !(lib.hasPrefix "/docs" relPath)
      && !(lib.hasPrefix "/.github" relPath)
      && !(lib.hasPrefix "/.agents" relPath)
      && !(lib.hasPrefix "/.claude" relPath)
      && !(lib.hasPrefix "/.codex" relPath)
      && !(lib.hasPrefix "/docker" relPath)
      # Top-level prose only (README, CHANGELOG, AGENTS...). Deeper markdown is
      # not necessarily documentation: skills/*/SKILL.md is a runtime file the
      # installPhase copies into the output.
      && builtins.match "/[^/]+\\.md" relPath == null
      # Test fixtures and build artifacts
      && !(lib.hasSuffix ".test.ts" baseName)
      && !(lib.hasSuffix ".e2e.test.ts" baseName)
      && baseName != "node_modules"
      && baseName != ".git"
      && baseName != ".paseo"
      && baseName != ".DS_Store"
      && baseName != "release";
  };

  # Replace the optional developer submodule with the flake's pinned source.
  postPatch = ''
    rm -rf vendor/oh-my-pi
    mkdir -p vendor
    cp -R ${ompSource} vendor/oh-my-pi
  '';

  nodejs = nodejs_22;
  inherit (paseo) npmDeps;

  # Prevent onnxruntime-node's install script from running during automatic
  # npm rebuild. We manually rebuild only node-pty in buildPhase.
  npmRebuildFlags = ["--ignore-scripts"];

  nativeBuildInputs =
    [
      bun
      python3 # for node-gyp (node-pty)
    ]
    ++ lib.optionals stdenv.hostPlatform.isLinux [
      autoPatchelfHook
      makeWrapper
      copyDesktopItems
    ];

  buildInputs = lib.optionals stdenv.hostPlatform.isLinux [
    libuv
    stdenv.cc.cc.lib # libstdc++ for sherpa-onnx prebuilt binaries
  ];

  dontNpmBuild = true;

  env = {
    BUN = "${bun}/bin/bun";
    OMP_SOURCE_COMMIT = "e4151593ace2781d1dc2f06d760301f88af3e9dc";
    EXPO_NO_TELEMETRY = "1";
    # Expo's web build pulls in some pre-bundled assets; ensure it doesn't try
    # to phone home during the build.
    CI = "1";
  };

  buildPhase = ''
    runHook preBuild
    npm run ensure:omp-runtime -- --ensure-platform-arches

    # Native deps (terminal emulation; libuv-linked on Linux)
    npm rebuild node-pty

    # Server workspaces (highlight + relay + protocol + client + server + cli)
    npm run build:server

    # App workspace deps not covered by build:server
    npm run build --workspace=@getpaseo/expo-two-way-audio

    # Expo web export for the Electron renderer
    ( cd packages/app && PASEO_WEB_PLATFORM=electron npx expo export --platform web )

    # Desktop main process
    npm run build:main --workspace=@ohmypcode/desktop

    ${lib.optionalString stdenv.hostPlatform.isDarwin ''
      # Let electron-builder create the native bundle layout (including helper
      # app names and bundle identifiers), but source Electron from nixpkgs
      # instead of downloading a release at build time. electron-builder edits
      # the copied helper plists, so stage a writable distribution rather than
      # pointing it directly at the read-only Nix store.
      electron_dist="$NIX_BUILD_TOP/electron-dist"
      mkdir -p "$electron_dist"
      cp -R ${electron}/Applications/Electron.app "$electron_dist/"
      chmod -R u+w "$electron_dist/Electron.app"
      (
        cd packages/desktop
        # The Nix output is not a distributable DMG, so leave it unsigned and
        # disable the hardened runtime that requires a matching signature.
        CSC_IDENTITY_AUTO_DISCOVERY=false \
          ../../node_modules/.bin/electron-builder \
            --config electron-builder.yml \
            --dir \
            --mac \
            --publish never \
            --config.electronDist="$electron_dist" \
            --config.buildVersion=${lib.escapeShellArg buildVersion} \
            --config.mac.identity=null \
            --config.mac.hardenedRuntime=false \
            --config.mac.notarize=false
      )
    ''}

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin

    ${lib.optionalString stdenv.hostPlatform.isLinux ''
      mkdir -p $out/share/ohmypcode-desktop

      # Materialize only the desktop and daemon runtime graphs. Copying the
      # complete monorepo used to ship every build-time dependency (including
      # Electron, Expo tooling, and cross-platform builder binaries), making the
      # desktop output larger than 2 GiB.
      PASEO_TRACE_DESKTOP=1 node scripts/trace-daemon.mjs > desktop-files.txt

      while IFS= read -r path; do
        [ -z "$path" ] && continue
        mkdir -p "$out/share/ohmypcode-desktop/$(dirname "$path")"
        cp -a "$path" "$out/share/ohmypcode-desktop/$path"
      done < desktop-files.txt

      # Keep the same unpackaged monorepo layout expected by main.js.
      cp package.json $out/share/ohmypcode-desktop/
      mkdir -p $out/share/ohmypcode-desktop/packages/app
      cp -a packages/app/dist $out/share/ohmypcode-desktop/packages/app/

      for runtime_path in \
        packages/desktop/dist/main.js \
        packages/desktop/dist/preload.js \
        packages/desktop/dist/features/browser-keyboard/guest-preload.js \
        packages/desktop/package.json; do
        if [ ! -e "$out/share/ohmypcode-desktop/$runtime_path" ]; then
          echo "desktop runtime trace omitted $runtime_path" >&2
          exit 1
        fi
      done

      runtime_root="$out/share/ohmypcode-desktop/ohmypcode/runtime/omp"
      runtime_source="ohmypcode/runtime/omp/${runtimePlatform}-${runtimeArch}"
      if [ ! -d "$runtime_source" ]; then
        echo "OMP runtime missing: $runtime_source" >&2
        exit 1
      fi
      mkdir -p "$runtime_root"
      cp -a "$runtime_source" "$runtime_root/"
      if [ ! -e "$runtime_root/${runtimePlatform}-${runtimeArch}/manifest.json" ]; then
        echo "OMP runtime manifest missing for ${runtimePlatform}-${runtimeArch}" >&2
        exit 1
      fi
      if [ ! -f ohmypcode/default-config.json ]; then
        echo "OhMyPCode default config missing" >&2
        exit 1
      fi
      mkdir -p "$out/share/ohmypcode-desktop/ohmypcode"
      cp -a ohmypcode/default-config.json "$out/share/ohmypcode-desktop/ohmypcode/default-config.json"

      if [ -e $out/share/ohmypcode-desktop/node_modules/electron ]; then
        echo "desktop runtime trace included npm Electron" >&2
        exit 1
      fi

      # Hicolor icon for desktop environments
      install -Dm644 packages/desktop/assets/icon.png \
        $out/share/icons/hicolor/512x512/apps/ohmypcode-desktop.png

      # Electron derives Wayland's toplevel app_id from the package name in the
      # app root it launches. Point it at a one-file app named "paseo-desktop"
      # so shells can match the window to the desktop entry and hicolor icon.
      mkdir -p $out/share/ohmypcode-desktop/electron-app
      printf '%s\n' "{ \"name\": \"ohmypcode-desktop\", \"version\": \"$version\", \"main\": \"index.js\" }" \
        > $out/share/ohmypcode-desktop/electron-app/package.json
      printf '%s\n' 'require("../packages/desktop/dist/main.js");' \
        > $out/share/ohmypcode-desktop/electron-app/index.js
      makeWrapper ${electron}/bin/electron $out/bin/ohmypcode-desktop \
        --add-flags "$out/share/ohmypcode-desktop/electron-app" \
        --add-flags "--no-sandbox" \
        --add-flags "--class=ohmypcode-desktop" \
        --set EXPO_DEV_URL "ohmypcode://app/" \
        --set CHROME_DESKTOP "ohmypcode-desktop.desktop"

      copyDesktopItems
    ''}

    ${lib.optionalString stdenv.hostPlatform.isDarwin ''
      app="$(find packages/desktop/release -maxdepth 3 -type d -name OhMyPCode.app -print -quit)"
      if [ -z "$app" ]; then
        echo "electron-builder did not produce OhMyPCode.app" >&2
        exit 1
      fi
      mkdir -p "$out/Applications"
      cp -R "$app" "$out/Applications/OhMyPCode.app"
      ln -s ../Applications/OhMyPCode.app/Contents/MacOS/OhMyPCode "$out/bin/ohmypcode-desktop"
    ''}

    runHook postInstall
  '';

  desktopItems = lib.optionals stdenv.hostPlatform.isLinux [
    (makeDesktopItem {
      name = "ohmypcode-desktop";
      desktopName = "OhMyPCode";
      genericName = "AI Coding Agents";
      comment = "OMP-first coding workspace";
      exec = "ohmypcode-desktop";
      icon = "ohmypcode-desktop";
      categories = ["Development"];
      startupWMClass = "ohmypcode-desktop";
    })
  ];

  meta = {
    description = "OhMyPCode desktop app (Electron wrapper)";
    homepage = "https://github.com/hussamsoft/OhMyPCode";
    license = lib.licenses.asl20;
    mainProgram = "ohmypcode-desktop";
    platforms = lib.platforms.linux ++ lib.platforms.darwin;
  };
}
