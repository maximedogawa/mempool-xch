import { describe, expect, test } from "bun:test";
import { countryPoint } from "./countryPoints";
import type { DashboardSnapshot } from "./dashboard";
import snapshot from "./dashboardSnapshot.json";
import {
  concentration,
  countryRows,
  countsOf,
  diffCountries,
  historyPoints,
  regionRows,
  scanRows,
  transportRows,
  UNMAPPED,
  versionBreakdown,
  versionHistoryPoints,
} from "./stats";

const SNAPSHOT = snapshot as DashboardSnapshot;

function make(partial: Partial<DashboardSnapshot>): DashboardSnapshot {
  return {
    schema: 2,
    asns: null,
    source: "test",
    observedAt: "2026-09-19T22:06:28.695Z",
    network: "mainnet",
    total: 0,
    ipv4: null,
    ipv6: null,
    capacity: null,
    countries: [],
    versions: [],
    ...partial,
  };
}

describe("country rows", () => {
  test("rank, share and coordinates come from the country table", () => {
    const rows = countryRows(
      make({
        total: 10,
        countries: [
          { key: "Germany", label: "Germany", nodes: 3 },
          { key: "United States", label: "United States", nodes: 7 },
        ],
      })
    );
    expect(rows.map((row) => row.label)).toEqual(["United States", "Germany"]);
    expect(rows[0]).toMatchObject({ code: "US", region: "North America", rank: 1, share: 0.7 });
    expect(rows[1]).toMatchObject({ code: "DE", region: "Europe", rank: 2, share: 0.3 });
    expect(rows[0]!.lat).not.toBeNull();
  });

  test("an unknown country still gets a row, flagged as unmapped", () => {
    const rows = countryRows(
      make({ total: 1, countries: [{ key: "Atlantis", label: "Atlantis", nodes: 1 }] })
    );
    expect(rows[0]).toMatchObject({ code: "—", region: UNMAPPED, lat: null, lon: null });
  });

  test("a zero total never divides by zero", () => {
    const rows = countryRows(make({ total: 0, countries: [{ key: "x", label: "x", nodes: 0 }] }));
    expect(rows[0]!.share).toBe(0);
  });

  test("every country in the shipped snapshot has a representative point", () => {
    const missing = SNAPSHOT.countries
      .filter((country) => countryPoint(country.label) === null)
      .map((country) => country.label);
    expect(missing).toEqual([]);
  });
});

describe("region rows", () => {
  test("totals, country counts and the region leader", () => {
    const rows = countryRows(
      make({
        total: 100,
        countries: [
          { key: "Germany", label: "Germany", nodes: 60 },
          { key: "France", label: "France", nodes: 30 },
          { key: "Japan", label: "Japan", nodes: 10 },
        ],
      })
    );
    expect(regionRows(rows)).toEqual([
      { region: "Europe", nodes: 90, countries: 2, share: 0.9, top: "Germany" },
      { region: "Asia", nodes: 10, countries: 1, share: 0.1, top: "Japan" },
    ]);
  });

  test("no rows means no regions rather than a divide by zero", () => {
    expect(regionRows([])).toEqual([]);
  });
});

describe("version breakdown", () => {
  test("shares are of the reporting nodes and the newest build is flagged", () => {
    const result = versionBreakdown(
      make({
        total: 400,
        versions: [
          { key: "2.7.10", label: "2.7.10", nodes: 50 },
          { key: "2.7.9", label: "2.7.9", nodes: 150 },
        ],
      })
    );
    expect(result.reporting).toBe(200);
    expect(result.coverage).toBe(0.5);
    expect(result.newest).toBe("2.7.10");
    expect(result.rows[0]).toMatchObject({
      label: "2.7.9",
      share: 0.75,
      line: "2.7",
      newest: false,
    });
    expect(result.rows[1]).toMatchObject({ label: "2.7.10", share: 0.25, newest: true });
  });

  test("an empty version panel reports no coverage", () => {
    const result = versionBreakdown(make({ total: 10 }));
    expect(result).toMatchObject({ rows: [], reporting: 0, coverage: 0, newest: null });
  });
});

describe("transport rows", () => {
  test("missing panels stay null instead of rendering as zero", () => {
    const rows = transportRows(make({ total: 200, ipv4: 150, ipv6: null, capacity: 50 }));
    expect(rows.map((row) => [row.id, row.nodes, row.share])).toEqual([
      ["ipv4", 150, 0.75],
      ["ipv6", null, null],
      ["reliable", 50, 0.25],
    ]);
  });
});

describe("concentration", () => {
  test("counts the largest countries needed to hold half the network", () => {
    const rows = countryRows(
      make({
        total: 100,
        countries: [
          { key: "United States", label: "United States", nodes: 40 },
          { key: "China", label: "China", nodes: 30 },
          { key: "Germany", label: "Germany", nodes: 30 },
        ],
      })
    );
    expect(concentration(rows)).toEqual({
      countriesForHalf: 2,
      topShare: 0.4,
      topLabel: "United States",
    });
    // The leader's share matches the country table's denominator, not the row sum.
    expect(
      concentration(
        countryRows(make({ total: 200, countries: [{ key: "x", label: "Germany", nodes: 50 }] }))
      )
    ).toMatchObject({
      topShare: 0.25,
    });
  });

  test("an empty snapshot has no leader", () => {
    expect(concentration([])).toEqual({ countriesForHalf: 0, topShare: 0, topLabel: null });
  });
});

describe("seeder-scan fallback rows", () => {
  const geo = (countryCode: string, country: string) => ({
    countryCode,
    country,
    city: null,
    lat: 0,
    lon: 0,
    org: null,
  });

  test("groups located nodes by country code, with the crawler's names and last seen", () => {
    const rows = scanRows({
      version: 1,
      nodes: {
        a: { ip: "a", firstSeen: 1, lastSeen: 10, hits: 1, geo: geo("DE", "Germany") },
        b: { ip: "b", firstSeen: 1, lastSeen: 30, hits: 1, geo: geo("DE", "Germany") },
        c: { ip: "c", firstSeen: 1, lastSeen: 20, hits: 1, geo: geo("RU", "Russian Federation") },
        d: { ip: "d", firstSeen: 1, lastSeen: 40, hits: 1, geo: null },
        e: { ip: "e", firstSeen: 1, lastSeen: 50, hits: 1 },
      },
    });
    expect(rows.map((row) => [row.key, row.label, row.nodes, row.lastSeen])).toEqual([
      ["DE", "Germany", 2, 30],
      ["RU", "Russia", 1, 20],
    ]);
    // Shares are of the located nodes only; unplaced and pending ones do not count.
    expect(rows[0]).toMatchObject({ share: 2 / 3, rank: 1, region: "Europe", code: "DE" });
    expect(rows[0]!.lat).not.toBeNull();
  });

  test("an unknown code keeps GeoJS's name and is unmapped", () => {
    const rows = scanRows({
      version: 1,
      nodes: { a: { ip: "a", firstSeen: 1, lastSeen: 1, hits: 1, geo: geo("XX", "Atlantis") } },
    });
    expect(rows[0]).toMatchObject({ label: "Atlantis", region: UNMAPPED, lat: null });
  });
});

describe("entrance diff", () => {
  const rows = [
    { key: "DE", nodes: 5 },
    { key: "US", nodes: 3 },
    { key: "FR", nodes: 1 },
  ];

  test("a first visit plays every country in", () => {
    expect([...diffCountries(null, rows).values()]).toEqual(["new", "new", "new"]);
  });

  test("a newer state plays only new and changed countries", () => {
    const diff = diffCountries({ DE: 5, US: 2 }, rows);
    expect(Object.fromEntries(diff)).toEqual({ US: "changed", FR: "new" });
    expect(diffCountries(countsOf(rows), rows).size).toBe(0);
  });
});

describe("history points", () => {
  test("population series skip gaps and carry their sample time", () => {
    const history = {
      start: 1_000,
      step: 10,
      total: [5, null, 7],
      capacity: [1, 1, 1],
      ipv4: [3, 3, 3],
      ipv6: [2, 2, 2],
    };
    expect(historyPoints(history, "total")).toEqual([
      { t: 1_000, v: 5 },
      { t: 1_020, v: 7 },
    ]);
    expect(historyPoints(null, "total")).toEqual([]);
  });

  test("version history stacks with zeros for absent versions and drops empty samples", () => {
    const result = versionHistoryPoints({
      start: 0,
      step: 10,
      series: [
        { label: "2.7.4", values: [null, null, 4] },
        { label: "other", values: [null, 2, 3] },
      ],
    });
    expect(result.labels).toEqual(["2.7.4", "other"]);
    expect(result.points).toEqual([
      { t: 10, values: [0, 2] },
      { t: 20, values: [4, 3] },
    ]);
  });
});
