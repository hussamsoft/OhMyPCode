import { z } from "zod";
import { execCommand } from "../../utils/spawn.js";
import { resolveOmpCommand } from "../omp-command.js";
export const OMP_COLLAB_TIMEOUT_MS = 15_000;

const OmpHostSchema = z.record(z.string(), z.unknown());
const OmpHostListSchema = z.object({
  version: z.number(),
  hosts: z.array(OmpHostSchema),
});

export interface OmpHostMetadata {
  readonly [key: string]: unknown;
}

export interface OmpCommandRunnerOptions {
  readonly timeout: number;
  readonly windowsHide: boolean;
  readonly maxBuffer: number;
}

export type OmpCommandRunner = (
  args: readonly string[],
  options: OmpCommandRunnerOptions,
) => Promise<{ stdout: string; stderr: string }>;

export interface OmpCollabService {
  listHosts(): Promise<readonly OmpHostMetadata[]>;
  createLink(instanceId: string, viewOnly?: boolean): Promise<string>;
  shareSession(session: string, gist?: boolean): Promise<string>;
}

export class OmpCollabError extends Error {
  readonly code = "omp_collab_failed" as const;

  constructor() {
    super("OMP collaboration operation failed");
    this.name = "OmpCollabError";
  }
}

function validateIdentifier(value: string): string {
  const identifier = typeof value === "string" ? value.trim() : "";
  if (identifier.length === 0 || identifier.startsWith("-")) {
    throw new OmpCollabError();
  }
  return identifier;
}

function parseHttpsLink(stdout: string): string {
  const link = stdout.trim();
  try {
    if (/\s/.test(link)) throw new Error();
    const url = new URL(link);
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error();
    }
    return link;
  } catch {
    throw new OmpCollabError();
  }
}

function parseHostList(stdout: string): readonly OmpHostMetadata[] {
  try {
    const parsed = OmpHostListSchema.parse(JSON.parse(stdout));
    return parsed.hosts;
  } catch {
    throw new OmpCollabError();
  }
}

const defaultRunner: OmpCommandRunner = async (args, options) => {
  const result = await execCommand(resolveOmpCommand(), [...args], {
    timeout: options.timeout,
    maxBuffer: options.maxBuffer,
  });
  return { stdout: result.stdout, stderr: result.stderr };
};

export function createOmpCollabService(runner: OmpCommandRunner = defaultRunner): OmpCollabService {
  async function run(args: readonly string[]): Promise<string> {
    try {
      const result = await runner(args, {
        timeout: OMP_COLLAB_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
      return result.stdout;
    } catch {
      throw new OmpCollabError();
    }
  }

  return {
    async listHosts() {
      return parseHostList(await run(["collab", "list", "--json"]));
    },

    async createLink(instanceId, viewOnly = false) {
      const id = validateIdentifier(instanceId);
      return parseHttpsLink(await run(["collab", "link", id, ...(viewOnly ? ["--view"] : [])]));
    },

    async shareSession(session, gist = false) {
      const target = validateIdentifier(session);
      return parseHttpsLink(await run(["share", target, ...(gist ? ["--gist"] : [])]));
    },
  };
}
