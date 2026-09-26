import {
  PaseoConfigRawSchema,
  normalizeLifecycleCommands,
  type PaseoConfigRaw,
} from "@ohmypcode/protocol/paseo-config-schema";
import { getPaseoConfigFileNameCandidates } from "../../../utils/paseo-config-file.js";
import { READ_ONLY_GIT_ENV } from "../../checkout-git-utils.js";
import { runGitCommand } from "../../../utils/run-git-command.js";

export async function hasUncommittedWorktreeSetupChanges(input: {
  repoRoot: string;
  currentConfig: PaseoConfigRaw | null;
}): Promise<boolean> {
  const gitPaths = await resolveConfigGitPaths(input.repoRoot);
  const committedConfig = await readCommittedConfig(input.repoRoot, gitPaths);
  const currentSetup = normalizeLifecycleCommands(input.currentConfig?.worktree?.setup);
  const committedSetup = normalizeLifecycleCommands(committedConfig?.worktree?.setup);
  return !stringArraysEqual(currentSetup, committedSetup);
}

async function resolveConfigGitPaths(repoRoot: string): Promise<string[]> {
  const { stdout } = await runGitCommand(["rev-parse", "--show-prefix"], {
    cwd: repoRoot,
    envOverlay: READ_ONLY_GIT_ENV,
  });
  const prefix = stdout.trim();
  return getPaseoConfigFileNameCandidates().map((name) => `${prefix}${name}`);
}

async function readCommittedConfig(
  repoRoot: string,
  gitPaths: string[],
): Promise<PaseoConfigRaw | null> {
  await runGitCommand(["rev-parse", "--verify", "HEAD"], {
    cwd: repoRoot,
    envOverlay: READ_ONLY_GIT_ENV,
  });
  for (const gitPath of gitPaths) {
    const { stdout: trackedPath } = await runGitCommand(
      ["ls-tree", "--name-only", "HEAD", "--", gitPath],
      {
        cwd: repoRoot,
        envOverlay: READ_ONLY_GIT_ENV,
      },
    );
    if (trackedPath.trim().length === 0) continue;

    const { stdout } = await runGitCommand(["show", `HEAD:${gitPath}`], {
      cwd: repoRoot,
      envOverlay: READ_ONLY_GIT_ENV,
    });
    return PaseoConfigRawSchema.parse(JSON.parse(stdout));
  }
  return null;
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
