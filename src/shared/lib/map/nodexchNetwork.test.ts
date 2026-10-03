import { describe, expect, test } from "bun:test";
import { parseSnapshot, parseTimeSeries, snapshotState } from "./dashboard";
import { fetchNodexchNetwork, parseNodexchNetwork } from "./nodexchNetwork";
import { countryRows, historyPoints, versionBreakdown } from "./stats";

/** The shape of `GET /x/node/v1/network`, recorded from a local gateway on 2026-10-02 and cut down. */
const NETWORK = {
  attribution: "IP geolocation by DB-IP (db-ip.com), CC BY 4.0",
  countries: [
    { country: "US", nodes: 2904 },
    { country: "CN", nodes: 1944 },
    { country: "DE", nodes: 1911 },
    { country: "ZZ", nodes: 3 },
    { country: "AT", nodes: 0 },
  ],
  history: [
    { day: "2026-09-29", nodes: 22142, source: "chia" },
    { day: "2026-09-30", nodes: 21825, source: "chia" },
    { day: "2026-10-02", nodes: 18665, source: "nodexch" },
  ],
  latest: {
    day: "2026-10-02",
    ipv4: 12699,
    ipv6: 5966,
    nodes: 18665,
    reliable: 5,
    source: "nodexch",
    taken_at: "2026-10-02T00:52:33.786326Z",
    versions: [
      { nodes: 117, version: "2.7.4" },
      { nodes: 31, version: "2.7.3" },
      { nodes: 11, version: "other" },
    ],
  },
  own: { latest: { day: "2026-10-02", nodes: 18665, source: "nodexch" }, since: "2026-09-27" },
  chain_time: 1790902147,
};

const OPTIONS = { network: "mainnet", source: "https://nodexch.space" } as const;

describe("parseNodexchNetwork", () => {
  test("the latest count becomes a snapshot the map's own checks accept", () => {
    const parsed = parseNodexchNetwork(NETWORK, OPTIONS);
    expect(parsed).not.toBeNull();
    const { snapshot } = parsed!;
    expect(parseSnapshot(snapshot)).toEqual(snapshot);
    expect(snapshot).toMatchObject({
      source: "https://nodexch.space",
      observedAt: "2026-10-02T00:52:33.786Z",
      network: "mainnet",
      total: 18665,
      ipv4: 12699,
      ipv6: 5966,
      capacity: 5,
      asns: null,
    });
    const now = Date.parse("2026-10-02T12:00:00Z");
    expect(snapshotState(snapshot, "mainnet", now).mode).toBe("snapshot");
    expect(snapshotState(snapshot, "testnet11", now).mode).toBe("scan");
  });

  test("countries are named and placed by their code; empty ones are dropped", () => {
    const { snapshot } = parseNodexchNetwork(NETWORK, OPTIONS)!;
    const rows = countryRows(snapshot);
    expect(rows.map((r) => [r.label, r.code, r.nodes])).toEqual([
      ["United States", "US", 2904],
      ["China", "CN", 1944],
      ["Germany", "DE", 1911],
      ["ZZ", "—", 3],
    ]);
    expect(rows[0]!.lat).not.toBeNull();
    expect(rows[3]!.lat).toBeNull();
  });

  test("the summed remainder is not ranked as a version", () => {
    const { snapshot } = parseNodexchNetwork(NETWORK, OPTIONS)!;
    const breakdown = versionBreakdown(snapshot);
    expect(breakdown.rows.map((r) => r.label)).toEqual(["2.7.4", "2.7.3"]);
    expect(breakdown.newest).toBe("2.7.4");
  });

  test("the history is one sample a day, with a gap where no day was counted", () => {
    const { series } = parseNodexchNetwork(NETWORK, OPTIONS)!;
    expect(parseTimeSeries(series)).not.toBeNull();
    expect(series!.history!.total).toEqual([22142, 21825, null, 18665]);
    expect(historyPoints(series!.history, "total").map((p) => p.v)).toEqual([22142, 21825, 18665]);
    expect(historyPoints(series!.history, "ipv6")).toEqual([]);
    expect(new Date(series!.history!.start).toISOString()).toBe("2026-09-29T00:00:00.000Z");
  });

  test("the geolocation credit is carried along", () => {
    expect(parseNodexchNetwork(NETWORK, OPTIONS)!.attribution).toBe(
      "IP geolocation by DB-IP (db-ip.com), CC BY 4.0"
    );
  });

  test("a gateway that has not counted yet, or an error body, is no snapshot", () => {
    expect(parseNodexchNetwork({ ...NETWORK, latest: null }, OPTIONS)).toBeNull();
    expect(parseNodexchNetwork({ ...NETWORK, countries: [] }, OPTIONS)).toBeNull();
    expect(parseNodexchNetwork({ success: false, error: "no indexer" }, OPTIONS)).toBeNull();
    expect(parseNodexchNetwork(null, OPTIONS)).toBeNull();
  });
});

describe("fetchNodexchNetwork", () => {
  test("asks the gateway's network route with the key", async () => {
    const calls: { url: string; auth: string | null }[] = [];
    const body = await fetchNodexchNetwork("https://nodexch.space/", "nxp_key", (url, init) => {
      calls.push({ url, auth: new Headers(init?.headers).get("authorization") });
      return Promise.resolve(Response.json(NETWORK));
    });
    expect(calls).toEqual([
      { url: "https://nodexch.space/x/node/v1/network", auth: "Bearer nxp_key" },
    ]);
    expect(parseNodexchNetwork(body, OPTIONS)).not.toBeNull();
  });

  test("a gateway without a count throws, which leaves the page on its snapshot", async () => {
    const answer = () => Promise.resolve(new Response("{}", { status: 502 }));
    await expect(fetchNodexchNetwork("https://nodexch.space", null, answer)).rejects.toThrow("502");
  });
});
