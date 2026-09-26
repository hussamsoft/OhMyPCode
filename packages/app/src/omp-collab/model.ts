import type { Agent } from "@/stores/session-store";

export interface OmpCollabHostSummary {
  instanceId: string;
  sessionName: string | null;
  cwd: string | null;
  model: string | null;
  pid: number | null;
  participants: number | null;
  relayConnected: boolean | null;
  inputRequired: boolean | null;
  busy: boolean | null;
  access: "view" | "control";
}

export interface OmpSessionShareTarget {
  agentId: string;
  sessionId: string;
  title: string | null;
  cwd: string;
  status: Agent["status"];
  updatedAt: Date;
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function finiteInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function modelLabel(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const model = value as Record<string, unknown>;
  const provider = boundedText(model.provider, 80);
  const id = boundedText(model.id, 120);
  if (provider && id) return `${provider}/${id}`;
  return id ?? provider;
}

export function summarizeOmpCollabHosts(
  hosts: readonly Record<string, unknown>[],
): OmpCollabHostSummary[] {
  return hosts.flatMap((host) => {
    const instanceId = boundedText(host.instanceId, 128);
    if (!instanceId) return [];
    return [
      {
        instanceId,
        sessionName: boundedText(host.sessionName, 160),
        cwd: boundedText(host.cwd, 240),
        model: modelLabel(host.model),
        pid: finiteInteger(host.pid),
        participants: finiteInteger(host.participants),
        relayConnected: booleanOrNull(host.relayConnected),
        inputRequired: booleanOrNull(host.inputRequired),
        busy: booleanOrNull(host.busy),
        access: host.access === "view" ? "view" : "control",
      },
    ];
  });
}

export function collectOmpSessionShareTargets(agents: Iterable<Agent>): OmpSessionShareTarget[] {
  const bySessionId = new Map<string, OmpSessionShareTarget>();
  for (const agent of agents) {
    if (agent.provider !== "omp") continue;
    const sessionId = boundedText(
      agent.runtimeInfo?.sessionId ?? agent.persistence?.sessionId,
      512,
    );
    if (!sessionId) continue;
    const candidate: OmpSessionShareTarget = {
      agentId: agent.id,
      sessionId,
      title: boundedText(agent.title, 160),
      cwd: boundedText(agent.cwd, 240) ?? agent.cwd,
      status: agent.status,
      updatedAt: agent.updatedAt,
    };
    const previous = bySessionId.get(sessionId);
    if (!previous || previous.updatedAt < candidate.updatedAt) {
      bySessionId.set(sessionId, candidate);
    }
  }
  return [...bySessionId.values()].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  );
}
