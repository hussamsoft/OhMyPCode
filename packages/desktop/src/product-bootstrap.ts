import os from "node:os";
import path from "node:path";

export function initializeOhMyPCodeEnvironment(): void {
  process.env.OHMYPCODE_HOME ??= path.join(os.homedir(), ".ohmypcode");
}
