import { describe, expect, it } from "vitest";
import { resolveOmpCommand } from "./omp-command.js";

describe("resolveOmpCommand", () => {
  it("uses the bundled OMP command override when present", () => {
    expect(resolveOmpCommand({ OMP_COMMAND: "C:/OhMyPCode/omp.exe" })).toBe(
      "C:/OhMyPCode/omp.exe",
    );
  });

  it("falls back to the PATH executable", () => {
    expect(resolveOmpCommand({})).toBe("omp");
  });
});
