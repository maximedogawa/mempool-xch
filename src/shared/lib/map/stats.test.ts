import { describe, expect, test } from "bun:test";
import { countryPoint } from "./countryPoints";
import type { DashboardSnapshot } from "./dashboard";
import snapshot from "./dashboardSnapshot.json";
import {
  concentration,
  countryRows,
  regionRows,
  transportRows,
  UNMAPPED,
  versionBreakdown,
} from "./stats";

const SNAPSHOT = snapshot as DashboardSnapshot;

function make(partial: Partial<DashboardSnapshot>): DashboardSnapshot {
  return {
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
