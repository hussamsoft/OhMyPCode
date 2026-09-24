#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const vendor = path.join(root, "vendor", "oh-my-pi");
const runtimeRoot = path.join(root, "ohmypcode", "runtime", "omp");

// These are the targets accepted by the pinned OMP release build script (v18.2.11).
const TARGETS = {
  "bun-darwin-arm64": { platform: "darwin", arch: "arm64", releaseTargetId: "darwin-arm64" },
  "bun-darwin-x64": { platform: "darwin", arch: "x64", releaseTargetId: "darwin-x64" },
  "bun-linux-x64-baseline": { platform: "linux", arch: "x64", releaseTargetId: "linux-x64" },
  "bun-linux-arm64": { platform: "linux", arch: "arm64", releaseTargetId: "linux-arm64" },
  "bun-linux-x64-musl-baseline": { platform: "linux", arch: "x64-musl", releaseTargetId: "linux-musl-x64" },
  "bun-linux-arm64-musl": { platform: "linux", arch: "arm64-musl", releaseTargetId: "linux-musl-arm64" },
  "bun-windows-x64-baseline": { platform: "win32", arch: "x64", releaseTargetId: "win32-x64" },
  "bun-windows-arm64": { platform: "win32", arch: "arm64", releaseTargetId: "win32-arm64" },
};

const TARGET_ALIASES = {
  "win32-x64": "bun-windows-x64-baseline",
};

function isFile(filePath) {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function bunCandidates() {
  const candidates = [];
  const configured = [process.env.BUN, process.env.BUN_PATH].filter(Boolean);
  for (const value of configured) {
    candidates.push(value, path.join(value, process.platform === "win32" ? "bun.exe" : "bun"));
  }
  const pathValue = process.env.PATH ?? "";
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")
    : [""];
  for (const entry of pathEntries) {
    for (const extension of extensions) {
      candidates.push(path.join(entry, `bun${extension.toLowerCase()}`));
      candidates.push(path.join(entry, `bun${extension.toUpperCase()}`));
    }
  }
  if (process.platform === "win32") {
    candidates.push(path.join(process.env.USERPROFILE ?? "", ".bun", "bin", "bun.exe"));
  } else {
    candidates.push(path.join(process.env.HOME ?? "", ".bun", "bin", "bun"));
  }
  return candidates;
}

function resolveBun() {
  for (const candidate of bunCandidates()) {
    if (isFile(candidate)) return candidate;
  }
  fail("Unable to resolve Bun. Set BUN or BUN_PATH to a Bun executable, add Bun to PATH, or install Bun using the standard user installation.");
}

function runBun(args, cwd) {
  const bun = resolveBun();
  if (path.extname(bun).toLowerCase() === ".cmd" || path.extname(bun).toLowerCase() === ".bat") {
    execFileSync(bun, args, { cwd, stdio: "inherit", shell: true });
    return;
  }
  execFileSync(bun, args, { cwd, stdio: "inherit" });
}

function bunVersion() {
  const bun = resolveBun();
  if (path.extname(bun).toLowerCase() === ".cmd" || path.extname(bun).toLowerCase() === ".bat") {
    return execFileSync(bun, ["--version"], { encoding: "utf8", shell: true }).trim();
  }
  return execFileSync(bun, ["--version"], { encoding: "utf8" }).trim();
}

function fail(message) {
  console.error(`[omp-runtime] ${message}`);
  process.exit(1);
}

function defaultTarget() {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  const key = `${platform}-${process.arch}`;
  return Object.keys(TARGETS).find((target) => target === `bun-${key}` || target === `bun-${key}-baseline`);
}

function parseArgs(args) {
  const targetIndex = args.indexOf("--target");
  const requestedTarget = targetIndex >= 0 ? args[targetIndex + 1] : undefined;
  const ensurePlatformArches = args.includes("--ensure-platform-arches");
  const ensure = args.includes("--ensure") || ensurePlatformArches;
  const resolvedTarget = requestedTarget ?? (ensure || args.includes("--check") ? defaultTarget() : undefined);
  if (!ensurePlatformArches && !resolvedTarget) fail("Pass --target with a target from the pinned OMP build script.");
  const target = TARGET_ALIASES[resolvedTarget] ?? resolvedTarget;
  if (target && !TARGETS[target]) {
    fail(`Unsupported Bun target '${resolvedTarget}'. Choose one of: ${Object.keys(TARGETS).join(", ")}`);
  }
  return { target, ensure, check: args.includes("--check"), ensurePlatformArches };
}


function readOmpVersion() {
  for (const file of ["package.json", "packages/coding-agent/package.json"]) {
    const candidate = path.join(vendor, file);
    if (existsSync(candidate)) {
      const value = JSON.parse(readFileSync(candidate, "utf8")).version;
      if (typeof value === "string") return value;
    }
  }
  fail("Unable to determine the pinned OMP version from vendor/oh-my-pi package metadata.");
}

function runtimeDir(target) {
  const info = TARGETS[target];
  return path.join(runtimeRoot, `${info.platform}-${info.arch}`);
}

function binaryName(target) {
  return TARGETS[target].platform === "win32" ? "omp.exe" : "omp";
}

function validateManifest(dir, target) {
  const manifestPath = path.join(dir, "manifest.json");
  const binaryPath = path.join(dir, binaryName(target));
  if (!existsSync(binaryPath) || !existsSync(manifestPath)) return false;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.target !== target) fail(`Existing OMP runtime target '${manifest.target}' does not match '${target}'.`);
  if (manifest.sha256 !== sha256(binaryPath)) fail(`Existing OMP runtime checksum does not match ${binaryPath}.`);
  for (const field of ["ompVersion", "sourceCommit", "bunVersion", "target", "sha256"]) {
    if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
      fail(`Existing OMP runtime manifest is missing ${field}: ${manifestPath}`);
    }
  }
  return true;
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function build(target) {
  if (!existsSync(path.join(vendor, "package.json"))) {
    fail("vendor/oh-my-pi is unavailable or incomplete; restore the pinned OMP checkout first.");
  }
  const sourceCommit = process.env.OMP_SOURCE_COMMIT?.trim() || (() => {
    try {
      return execFileSync("git", ["-C", vendor, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    } catch {
      fail("Unable to determine OMP source commit; set OMP_SOURCE_COMMIT for a source tree without .git metadata.");
    }
  })();
  runBun(["install", "--frozen-lockfile"], vendor);
  runBun(["run", "build:native"], vendor);
  runBun(["scripts/ci-release-build-binaries.ts", "--targets", TARGETS[target].releaseTargetId], vendor);

  const info = TARGETS[target];
  const sourceName = `omp-${info.platform === "win32" ? "windows" : info.platform}-${info.arch}${info.platform === "win32" ? ".exe" : ""}`;
  const source = path.join(vendor, "packages", "coding-agent", "binaries", sourceName);
  if (!existsSync(source)) fail(`OMP release build did not produce the selected binary: ${source}`);

  const dir = runtimeDir(target);
  mkdirSync(dir, { recursive: true });
  copyFileSync(source, path.join(dir, binaryName(target)));
  const manifest = {
    ompVersion: readOmpVersion(),
    sourceCommit,
    bunVersion: bunVersion(),
    target,
    sha256: sha256(path.join(dir, binaryName(target))),
  };
  writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[omp-runtime] built ${target} at ${path.relative(root, dir)}`);
}

const { target, ensure, check, ensurePlatformArches } = parseArgs(process.argv.slice(2));
if (ensurePlatformArches) {
  const platform = process.platform === "win32" ? "win32" : process.platform;
  const targets = Object.entries(TARGETS)
    .filter(([, info]) => info.platform === platform)
    .map(([name]) => name);
  for (const candidate of targets) {
    const dir = runtimeDir(candidate);
    if (!existsSync(dir) || !validateManifest(dir, candidate)) build(candidate);
  }
} else if (check) {
  const dir = runtimeDir(target);
  if (!existsSync(dir) || !validateManifest(dir, target)) fail(`No valid OMP runtime exists for ${target}.`);
} else if (ensure) {
  const dir = runtimeDir(target);
  if (existsSync(dir) && validateManifest(dir, target)) process.exit(0);
  build(target);
} else {
  build(target);
}
