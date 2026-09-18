import { describe, expect, test } from "bun:test";
import { GEO_BATCH_SIZE, lookupGeo, parseGeoRows } from "./geo";
import { LAND_COLS, LAND_ROWS, LAND_RUNS } from "./landDots";
import { cellCenter, MAP_HEIGHT, MAP_WIDTH, project } from "./projection";
import { applyGeo, clusterNodes, countByCountry, emptyRegistry, MAX_AGE_MS, MAX_NODES, mergeObserved, parseRegistry, pendingGeo } from "./registry";
import { isPublicIp, parseDohAnswer, resolveSeeder } from "./seeders";

const doh = {
  Status: 0,
  Answer: [
    { name: "dns-introducer.chia.net.", type: 1, TTL: 300, data: "88.27.59.9" },
    { name: "dns-introducer.chia.net.", type: 1, TTL: 300, data: "10.0.0.5" },
    { name: "dns-introducer.chia.net.", type: 1, TTL: 300, data: "88.27.59.9" },
    { name: "dns-introducer.chia.net.", type: 28, TTL: 300, data: "2a02:8109:1::1" },
  ],
};

describe("seeders", () => {
  test("keeps only public addresses of the requested record type, deduplicated", () => {
    expect(parseDohAnswer(doh, "A")).toEqual(["88.27.59.9"]);
    expect(parseDohAnswer(doh, "AAAA")).toEqual(["2a02:8109:1::1"]);
    expect(parseDohAnswer({ Status: 3, Answer: doh.Answer }, "A")).toEqual([]);
  });

  test("private, loopback and link-local ranges are not nodes", () => {
    for (const ip of ["10.1.2.3", "192.168.0.1", "172.16.4.4", "127.0.0.1", "169.254.1.1", "100.64.0.1", "224.0.0.1", "::1", "fe80::1", "fd00::1"]) expect(isPublicIp(ip)).toBe(false);
    for (const ip of ["88.27.59.9", "172.15.0.1", "8.8.8.8", "2a02:8109:1::1"]) expect(isPublicIp(ip)).toBe(true);
  });

  test("falls back to the second DoH endpoint when the first fails", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string) => {
      calls.push(url);
      if (url.startsWith("https://cloudflare-dns.com")) return new Response("nope", { status: 502 });
      return new Response(JSON.stringify(doh), { status: 200, headers: { "content-type": "application/json" } });
    };
    expect(await resolveSeeder("dns-introducer.chia.net", "A", fetchImpl)).toEqual(["88.27.59.9"]);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain("dns.google/resolve?name=dns-introducer.chia.net&type=A");
  });
});

describe("geo", () => {
  test("parses GeoJS rows and marks unplaceable ones as null", () => {
    const rows = parseGeoRows([
      { ip: "8.8.8.8", country: "United States", country_code: "US", latitude: "37.751", longitude: "-97.822", organization_name: "Google LLC" },
      { ip: "1.1.1.1", latitude: "nil", longitude: "nil" },
      { nope: true },
    ]);
    expect(rows.get("8.8.8.8")).toEqual({ countryCode: "US", country: "United States", city: null, lat: 37.751, lon: -97.822, org: "Google LLC" });
    expect(rows.get("1.1.1.1")).toBeNull();
    expect(rows.size).toBe(2);
  });

  test("lookupGeo batches, and an IP missing from the answer is settled as null", async () => {
    const ips = Array.from({ length: GEO_BATCH_SIZE + 5 }, (_, i) => `8.8.${i}.1`);
    let url = "";
    const fetchImpl = async (u: string) => {
      url = u;
      return new Response(JSON.stringify([{ ip: "8.8.0.1", country_code: "US", latitude: 1, longitude: 2 }]));
    };
    const result = await lookupGeo(ips, fetchImpl);
    expect(url.split(",").length).toBe(GEO_BATCH_SIZE);
    expect(result.size).toBe(GEO_BATCH_SIZE);
    expect(result.get("8.8.0.1")?.countryCode).toBe("US");
    expect(result.get("8.8.1.1")).toBeNull();
    expect(await lookupGeo([], fetchImpl)).toEqual(new Map());
  });
});

describe("registry", () => {
  const geo = (countryCode: string, lat: number, lon: number, city: string | null = null) => ({ countryCode, country: countryCode === "DE" ? "Germany" : "United States", city, lat, lon, org: null });

  test("merging records first and last seen, hit counts and which addresses are new", () => {
    const first = mergeObserved(emptyRegistry(), ["1.1.1.1", "2.2.2.2"], 1_000);
    expect(first.added).toEqual(["1.1.1.1", "2.2.2.2"]);
    const second = mergeObserved(first.registry, ["2.2.2.2", "3.3.3.3"], 2_000);
    expect(second.added).toEqual(["3.3.3.3"]);
    expect(second.registry.nodes["2.2.2.2"]).toEqual({ ip: "2.2.2.2", firstSeen: 1_000, lastSeen: 2_000, hits: 2 });
    expect(second.registry.nodes["1.1.1.1"]?.hits).toBe(1);
  });

  test("evicts the least recently seen nodes beyond the cap", () => {
    let registry = emptyRegistry();
    for (let i = 0; i < MAX_NODES + 10; i += 1) registry = mergeObserved(registry, [`10.${i >> 16}.${(i >> 8) & 255}.${i & 255}`.replace(/^10\./, "11.")], i).registry;
    expect(Object.keys(registry.nodes)).toHaveLength(MAX_NODES);
    expect(registry.nodes["11.0.0.0"]).toBeUndefined();
    expect(registry.nodes["11.0.0.10"]).toBeDefined();
  });

  test("parsing drops stale nodes and garbage; round-trips the rest", () => {
    const now = 10 * MAX_AGE_MS;
    const registry = applyGeo(mergeObserved(emptyRegistry(), ["1.1.1.1"], now).registry, new Map([["1.1.1.1", geo("DE", 52.5, 13.4, "Berlin")]]));
    registry.nodes["9.9.9.9"] = { ip: "9.9.9.9", firstSeen: 0, lastSeen: now - MAX_AGE_MS - 1, hits: 1 };
    const parsed = parseRegistry(JSON.stringify(registry), now);
    expect(Object.keys(parsed.nodes)).toEqual(["1.1.1.1"]);
    expect(parsed.nodes["1.1.1.1"]?.geo?.city).toBe("Berlin");
    expect(parseRegistry("{not json", now)).toEqual(emptyRegistry());
    expect(parseRegistry(JSON.stringify({ version: 2, nodes: {} }), now)).toEqual(emptyRegistry());
    expect(parseRegistry(null)).toEqual(emptyRegistry());
  });

  test("pending geo lists only nodes never looked up, newest first", () => {
    let registry = mergeObserved(emptyRegistry(), ["1.1.1.1", "2.2.2.2"], 1).registry;
    registry = mergeObserved(registry, ["3.3.3.3"], 2).registry;
    registry = applyGeo(registry, new Map([["1.1.1.1", null]]));
    expect(pendingGeo(registry, 10)).toEqual(["3.3.3.3", "2.2.2.2"]);
    expect(pendingGeo(registry, 1)).toEqual(["3.3.3.3"]);
  });

  test("countries and clusters", () => {
    let registry = mergeObserved(emptyRegistry(), ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"], 1).registry;
    registry = applyGeo(
      registry,
      new Map([
        ["1.1.1.1", geo("DE", 52.5, 13.4, "Berlin")],
        ["2.2.2.2", geo("DE", 52.6, 13.3, "Berlin")],
        ["3.3.3.3", geo("US", 37.7, -122.4, "San Francisco")],
        ["4.4.4.4", null],
      ])
    );
    expect(countByCountry(registry)).toEqual([
      { countryCode: "DE", country: "Germany", nodes: 2, share: 2 / 3 },
      { countryCode: "US", country: "United States", nodes: 1, share: 1 / 3 },
    ]);
    const clusters = clusterNodes(Object.values(registry.nodes));
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toMatchObject({ key: "53,13", label: "Berlin, Germany" });
    expect(clusters[0]?.nodes).toHaveLength(2);
    expect(clusters[1]?.label).toBe("San Francisco, United States");
  });
});

describe("projection and land dots", () => {
  test("projects the corners of the window and clamps latitude", () => {
    expect(project(-180, 84)).toEqual({ x: 0, y: 0 });
    expect(project(180, -56)).toEqual({ x: MAP_WIDTH, y: MAP_HEIGHT });
    expect(project(0, -80).y).toBe(MAP_HEIGHT);
    expect(project(13.4, 52.5)).toEqual({ x: 537.2, y: 87.5 });
  });

  test("the generated land grid is consistent and Berlin sits on land, the mid-Atlantic does not", () => {
    expect(LAND_RUNS).toHaveLength(LAND_ROWS);
    const isLand = (lon: number, lat: number) => {
      const col = Math.floor(((lon + 180) / 360) * LAND_COLS);
      const row = Math.floor(((84 - lat) / 140) * LAND_ROWS);
      const runs = LAND_RUNS[row] ?? [];
      for (let i = 0; i < runs.length; i += 2) if (col >= runs[i]! && col < runs[i]! + runs[i + 1]!) return true;
      return false;
    };
    expect(isLand(13.4, 52.5)).toBe(true);
    expect(isLand(-100, 40)).toBe(true);
    expect(isLand(-30, 30)).toBe(false);
    expect(cellCenter(0, 0).x).toBeGreaterThan(0);
  });
});
