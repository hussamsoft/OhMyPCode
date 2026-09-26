import os from "node:os";

import {
  ConnectionOfferV2Schema,
  type ConnectionOffer,
} from "@ohmypcode/protocol/connection-offer";

interface BuildOfferEndpointsArgs {
  listenHost: string;
  port: number;
}

export function buildOfferEndpoints({ listenHost, port }: BuildOfferEndpointsArgs): string[] {
  const endpoints: string[] = [];

  const isLoopbackHost = listenHost === "127.0.0.1" || listenHost === "localhost";
  const isWildcardHost = listenHost === "0.0.0.0" || listenHost === "::" || listenHost === "[::]";

  if (isWildcardHost) {
    const lanIp = getPrimaryLanIp();
    if (lanIp) {
      endpoints.push(`${lanIp}:${port}`);
    }
  } else if (!isLoopbackHost) {
    endpoints.push(`${listenHost}:${port}`);
  }

  endpoints.push(`localhost:${port}`);

  return dedupePreserveOrder(endpoints);
}

export async function createConnectionOfferV2(args: {
  serverId: string;
  daemonPublicKeyB64: string;
  relay: { endpoint: string; useTls?: boolean };
}): Promise<ConnectionOffer> {
  return ConnectionOfferV2Schema.parse({
    v: 2,
    serverId: args.serverId,
    daemonPublicKeyB64: args.daemonPublicKeyB64,
    relay: args.relay,
  });
}

export function encodeOfferToFragmentUrl(args: {
  offer: ConnectionOffer;
  appBaseUrl: string;
}): string {
  const json = JSON.stringify(args.offer);
  const encoded = Buffer.from(json, "utf8").toString("base64url");
  return `${args.appBaseUrl.replace(/\/$/, "")}/#offer=${encoded}`;
}

let warnedStalePrimaryLanIp = false;

function getPrimaryLanIp(): string | null {
  let override = process.env.OMPCODE_PRIMARY_LAN_IP?.trim();
  // COMPAT(paseoEnv): remove after 2027-01-01.
  if (!override && process.env.PASEO_PRIMARY_LAN_IP !== undefined) {
    override = process.env.PASEO_PRIMARY_LAN_IP.trim();
    if (!warnedStalePrimaryLanIp) {
      warnedStalePrimaryLanIp = true;
      console.warn(
        "[connection-offer] PASEO_PRIMARY_LAN_IP is set but no longer read directly; using " +
          "its value as a fallback. Rename it to OMPCODE_PRIMARY_LAN_IP -- " +
          "PASEO_PRIMARY_LAN_IP support may be removed in a future release.",
      );
    }
  }
  if (override) return override;

  const nets = os.networkInterfaces();
  const names = Object.keys(nets).sort();

  for (const name of names) {
    const addrs = nets[name] ?? [];
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
}

function dedupePreserveOrder(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
