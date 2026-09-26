import { describe, expect, test } from "vitest";
import {
  OmpAgentSessionEventSchema,
  OmpRpcCommandSchema,
  OmpRuntimeEventSchema,
  OmpToolCatalogResultSchema,
  OmpVibeSendResultSchema,
  OmpVibeWaitResultSchema,
} from "./rpc-types";

describe("OMP RPC types", () => {
  test("validates OMP Vibe commands without mutating their target identity", () => {
    const command = {
      id: "request-1",
      type: "vibe_send",
      session: "worker-1",
      message: "coordinate the release",
    };

    expect(OmpRpcCommandSchema.parse(command)).toEqual(command);
    expect(
      OmpRpcCommandSchema.safeParse({
        id: "request-2",
        type: "vibe_wait",
        sessions: [""],
        timeoutMs: 0,
      }).success,
    ).toBe(false);
  });

  test("validates OMP result envelopes and constrained values", () => {
    expect(OmpVibeSendResultSchema.parse({ delivery: "steered", requestId: "request-1" })).toEqual({
      delivery: "steered",
      requestId: "request-1",
    });
    expect(
      OmpVibeWaitResultSchema.safeParse({
        settled: [{ id: "worker-1", jobId: "job-1", status: "running", resultText: "" }],
        stillRunning: [],
        timedOut: false,
      }).success,
    ).toBe(false);
    expect(
      OmpToolCatalogResultSchema.safeParse({
        tools: [
          {
            name: "read",
            label: "Read",
            description: "Read a file",
            source: "unknown",
            enabled: true,
            required: false,
          },
        ],
      }).success,
    ).toBe(false);
  });

  test("validates nested session and runtime events", () => {
    const messageUpdate = {
      type: "message_update",
      message: { role: "assistant", content: [{ type: "text", text: "Working" }] },
      assistantMessageEvent: { type: "text_delta", delta: "Working" },
    };
    const subagentEvent = {
      type: "subagent_event",
      payload: { id: "child-1", event: { type: "agent_start" } },
    };
    const vibeState = {
      type: "vibe_state",
      payload: { revision: 3, enabled: true, workers: [] },
    };

    expect(OmpAgentSessionEventSchema.parse(messageUpdate)).toEqual(messageUpdate);
    expect(OmpRuntimeEventSchema.parse(subagentEvent)).toEqual(subagentEvent);
    expect(OmpRuntimeEventSchema.parse(vibeState)).toEqual(vibeState);
    expect(
      OmpRuntimeEventSchema.safeParse({
        type: "vibe_state",
        payload: { revision: -1, enabled: true, workers: [] },
      }).success,
    ).toBe(false);
  });
});
