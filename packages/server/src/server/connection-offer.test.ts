import { afterEach, describe, expect, test } from "vitest";

import { buildOfferEndpoints } from "./connection-offer.js";

describe("buildOfferEndpoints", () => {
  const previousOmpcode = process.env.OMPCODE_PRIMARY_LAN_IP;
  const previousPaseo = process.env.PASEO_PRIMARY_LAN_IP;

  afterEach(() => {
    if (previousOmpcode === undefined) delete process.env.OMPCODE_PRIMARY_LAN_IP;
    else process.env.OMPCODE_PRIMARY_LAN_IP = previousOmpcode;
    if (previousPaseo === undefined) delete process.env.PASEO_PRIMARY_LAN_IP;
    else process.env.PASEO_PRIMARY_LAN_IP = previousPaseo;
  });

  test("OMPCODE_PRIMARY_LAN_IP overrides LAN discovery for a wildcard listen host", () => {
    delete process.env.PASEO_PRIMARY_LAN_IP;
    process.env.OMPCODE_PRIMARY_LAN_IP = "10.0.0.5";
    expect(buildOfferEndpoints({ listenHost: "0.0.0.0", port: 6767 })).toEqual([
      "10.0.0.5:6767",
      "localhost:6767",
    ]);
  });

  test("PASEO_PRIMARY_LAN_IP is a COMPAT(paseoEnv) fallback", () => {
    delete process.env.OMPCODE_PRIMARY_LAN_IP;
    process.env.PASEO_PRIMARY_LAN_IP = "10.0.0.9";
    expect(buildOfferEndpoints({ listenHost: "0.0.0.0", port: 6767 })).toEqual([
      "10.0.0.9:6767",
      "localhost:6767",
    ]);
  });

  test("OMPCODE_PRIMARY_LAN_IP takes priority when both are set", () => {
    process.env.OMPCODE_PRIMARY_LAN_IP = "10.0.0.5";
    process.env.PASEO_PRIMARY_LAN_IP = "10.0.0.9";
    expect(buildOfferEndpoints({ listenHost: "0.0.0.0", port: 6767 })).toEqual([
      "10.0.0.5:6767",
      "localhost:6767",
    ]);
  });

  test("a loopback listen host never includes a LAN endpoint", () => {
    delete process.env.OMPCODE_PRIMARY_LAN_IP;
    delete process.env.PASEO_PRIMARY_LAN_IP;
    expect(buildOfferEndpoints({ listenHost: "127.0.0.1", port: 6767 })).toEqual([
      "localhost:6767",
    ]);
  });

  test("a non-loopback, non-wildcard listen host is used directly", () => {
    expect(buildOfferEndpoints({ listenHost: "192.168.1.20", port: 6767 })).toEqual([
      "192.168.1.20:6767",
      "localhost:6767",
    ]);
  });
});
