import { describe, expect, test } from "vitest";
import type {
  AgentStreamEvent as ProtocolAgentStreamEvent,
  AgentToolDefinition as ProtocolAgentToolDefinition,
} from "@getpaseo/protocol/agent-types";
import type { AgentStreamEvent, AgentToolDefinition } from "./agent-sdk-types.js";

const tool: ProtocolAgentToolDefinition = {
  name: "read",
  label: "Read",
  description: "Read a file",
  source: "native",
  enabled: true,
  required: true,
};
const serverTool: AgentToolDefinition = tool;

const toolsUpdatedProtocol = {
  type: "tools_updated",
  provider: "omp",
  tools: [tool],
} satisfies ProtocolAgentStreamEvent;
const toolsUpdatedServer = {
  type: "tools_updated",
  provider: "omp",
  tools: [serverTool],
} satisfies AgentStreamEvent;

const providerStateProtocol = {
  type: "provider_state_updated",
  provider: "omp",
  stateKey: "vibe",
  state: { revision: 1, enabled: false, workers: [] },
} satisfies ProtocolAgentStreamEvent;
const providerStateServer = {
  type: "provider_state_updated",
  provider: "omp",
  stateKey: "vibe",
  state: { revision: 1, enabled: false, workers: [] },
} satisfies AgentStreamEvent;

describe("mirrored provider stream contracts", () => {
  test("satisfies protocol and server unions with the same tool and provider-state variants", () => {
    expect([toolsUpdatedProtocol, toolsUpdatedServer]).toHaveLength(2);
    expect([providerStateProtocol, providerStateServer]).toHaveLength(2);
  });
});
