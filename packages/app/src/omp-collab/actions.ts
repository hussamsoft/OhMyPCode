import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";

export type OmpCollabAccess = "view" | "control";

type OmpCollabActionClient = Pick<DaemonClient, "createOmpCollabLink" | "shareOmpSession">;

type WriteClipboard = (value: string) => Promise<unknown>;

const SAFE_ACTION_ERROR_MESSAGE = "OMP share action failed";

export class OmpCollabActionError extends Error {
  constructor() {
    super(SAFE_ACTION_ERROR_MESSAGE);
    this.name = "OmpCollabActionError";
  }
}

function requireSecureShareLink(value: string): string {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new OmpCollabActionError();
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new OmpCollabActionError();
  }
  return trimmed;
}

async function copySecretLink(
  request: () => Promise<{ link: string }>,
  writeClipboard: WriteClipboard,
) {
  try {
    const { link } = await request();
    await writeClipboard(requireSecureShareLink(link));
  } catch {
    // Never retain the original error: daemon and clipboard errors can include the
    // possession credential. Callers only receive this secret-free sentinel.
    throw new OmpCollabActionError();
  }
}

export async function createAndCopyOmpCollabLink(input: {
  client: OmpCollabActionClient;
  instanceId: string;
  access: OmpCollabAccess;
  writeClipboard: WriteClipboard;
}): Promise<void> {
  await copySecretLink(
    () =>
      input.client.createOmpCollabLink(input.instanceId, {
        viewOnly: input.access === "view",
      }),
    input.writeClipboard,
  );
}

export async function shareAndCopyOmpSession(input: {
  client: OmpCollabActionClient;
  sessionId: string;
  writeClipboard: WriteClipboard;
}): Promise<void> {
  await copySecretLink(
    () => input.client.shareOmpSession(input.sessionId, { gist: false }),
    input.writeClipboard,
  );
}
