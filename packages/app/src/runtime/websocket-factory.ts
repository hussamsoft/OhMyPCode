import { nativeWebSocketFactory } from "@ohmypcode/client/internal/daemon-client-websocket-transport";
import type { WebSocketFactory } from "@ohmypcode/client/internal/daemon-client-transport-types";

export function createAppWebSocketFactory(): WebSocketFactory {
  return nativeWebSocketFactory;
}
