import { describe, expect, test } from "bun:test";
import recorded from "@/test-utils/fixtures/chia_dashboard_peer_info.json";
import {
  alignSeries,
  OTHER_VERSIONS,
  parseAsnTable,
  parseDashboardBreakdown,
  parseDashboardMetric,
  parseGrafanaSeries,
  parseSnapshot,
  SNAPSHOT_MAX_AGE_MS,
  snapshotState,
  topSeries,
  type DashboardSeries,
  type DashboardSnapshot,
} from "./dashboard";
import shipped from "./dashboardSnapshot.json";

function frame(label: Record<string, string>, values: unknown[], times: unknown[] = [1]) {
  return {
    schema: {
      fields: [
        { name: "Time", type: "time" },
        {
          name: "Value",
          type: "number",
          labels: label,
          config: { displayNameFromDS: Object.values(label)[0] },
        },
      ],
    },
    data: { values: [times, values] },
  };
}

const DAY = 86_400_000;

function snapshot(partial: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    schema: 2,
    source: "https://dashboard.chia.net/d/em15uQ47k/peer-info",
    observedAt: "2026-09-23T10:00:00.000Z",
    network: "mainnet",
    total: 100,
    ipv4: 60,
    ipv6: 40,
    capacity: 10,
    countries: [{ key: "Germany", label: "Germany", nodes: 100, code: "DE" }],
    versions: [],
    asns: null,
    history: null,
    versionHistory: null,
    ...partial,
  };
}

describe("Chia dashboard Grafana mapping", () => {
  test("flattens labelled frames and keeps the newest values", () => {
    const raw = {
      results: {
        A: {
          frames: [
            frame({ country: "AT" }, [4, 7], [1, 2]),
            frame({ country_display: "Austria" }, [4, 7], [1, 2]),
          ],
        },
      },
    };
    expect(parseGrafanaSeries(raw)).toHaveLength(2);
    expect(parseDashboardMetric(raw)).toBe(7);
    expect(parseDashboardBreakdown(raw)).toEqual([
      { key: "AT", label: "AT", nodes: 7 },
      { key: "Austria", label: "Austria", nodes: 7 },
    ]);
  });

  test("ignores malformed panels and sorts ties deterministically", () => {
    const raw = {
      results: {
        A: { frames: [frame({ version: "2.7.0" }, [10]), frame({ version: "2.6.0" }, [10])] },
        B: { frames: [{ schema: {}, data: {} }, null] },
      },
    };
    expect(parseDashboardBreakdown(raw)).toEqual([
      { key: "2.6.0", label: "2.6.0", nodes: 10 },
      { key: "2.7.0", label: "2.7.0", nodes: 10 },
    ]);
    expect(parseDashboardMetric({ results: { A: { frames: [] } } })).toBeNull();
  });

  test("a recorded country panel gives display names, ISO codes and counts", () => {
    const rows = parseDashboardBreakdown(recorded.countries);
    expect(rows.map((row) => row.code)).toEqual(["US", "DE", "AT", "GL"]);
    expect(rows[0]).toMatchObject({ key: "United States", label: "United States" });
    expect(rows.every((row) => row.nodes > 0 && !row.label.startsWith("{"))).toBe(true);
  });

  test("a recorded range query lands on a daily grid, the trailing sample does not win", () => {
    const series = parseGrafanaSeries(recorded.totalHistory)[0];
    expect(series?.times.length).toBe(series?.values.length);
    const grid = alignSeries(series, recorded.start, recorded.step, 5);
    expect(grid).toHaveLength(5);
    expect(grid.every((value) => typeof value === "number" && value > 1_000)).toBe(true);
    // The last slot keeps the sample taken at its own midnight, not the later end-of-query one.
    const onSlot = series!.times.indexOf(recorded.start + 4 * recorded.step);
    expect(grid[4]).toBe(series!.values[onSlot]!);
  });

  test("a recorded ASN table becomes operator count, node sum and the largest rows", () => {
    const asns = parseAsnTable(recorded.asn, 2);
    expect(asns?.count).toBe(3);
    expect(asns?.top).toHaveLength(2);
    expect(asns?.top[0]).toMatchObject({ asn: 4134, organization: "Chinanet" });
    expect(asns!.nodes).toBeGreaterThan(asns!.top[0]!.nodes);
    expect(parseAsnTable({ results: {} })).toBeNull();
  });
});

describe("history grid", () => {
  const series = (key: string, values: number[], times: number[]): DashboardSeries => ({
    key,
    label: key,
    labels: {},
    values,
    times,
  });

  test("gaps stay null and off-grid samples are dropped", () => {
    expect(alignSeries(series("x", [1, 3, 9], [0, 2 * DAY, 7 * DAY]), 0, DAY, 4)).toEqual([
      1,
      null,
      3,
      null,
    ]);
    expect(alignSeries(undefined, 0, DAY, 2)).toEqual([null, null]);
  });

  test("keeps today's leaders and the former peaks, and sums the rest", () => {
    const at = [0, DAY];
    const result = topSeries(
      [
        series("old-peak", [900, 0], at),
        series("new", [0, 500], at),
        series("small-a", [5, 6], at),
        series("small-b", [7, 8], at),
      ],
      0,
      DAY,
      2,
      2
    );
    expect(result.map((item) => item.label)).toEqual(["old-peak", "new", OTHER_VERSIONS]);
    expect(result.at(-1)?.values).toEqual([12, 14]);
  });
});

describe("snapshot file", () => {
  test("the shipped snapshot passes the page's own check, with history and ASNs", () => {
    const parsed = parseSnapshot(shipped);
    expect(parsed).not.toBeNull();
    expect(parsed!.countries.length).toBeGreaterThan(50);
    expect(parsed!.history?.total.length).toBeGreaterThan(300);
    expect(parsed!.versionHistory?.series.length).toBeGreaterThan(1);
    expect(parsed!.asns?.top.length).toBeGreaterThan(0);
  });

  test("anything incomplete counts as missing; optional panels may be absent alone", () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot({ ...snapshot(), schema: 1 })).toBeNull();
    expect(parseSnapshot({ ...snapshot(), countries: [] })).toBeNull();
    expect(parseSnapshot({ ...snapshot(), observedAt: "yesterday" })).toBeNull();
    expect(parseSnapshot({ ...snapshot(), total: 0 })).toBeNull();
    const partial = parseSnapshot({ ...snapshot(), history: { start: 0, step: DAY, total: [1] } });
    expect(partial).not.toBeNull();
    expect(partial!.history).toBeNull();
  });

  test("fresh, stale, missing and other-network snapshots", () => {
    const observed = Date.parse("2026-09-23T10:00:00.000Z");
    expect(snapshotState(snapshot(), "mainnet", observed + DAY).mode).toBe("snapshot");
    expect(snapshotState(snapshot(), "mainnet", observed + SNAPSHOT_MAX_AGE_MS + 1)).toMatchObject({
      mode: "scan",
      reason: "stale",
    });
    expect(snapshotState(null, "mainnet", observed)).toMatchObject({
      mode: "scan",
      reason: "missing",
    });
    expect(snapshotState(snapshot(), "testnet11", observed)).toMatchObject({
      mode: "scan",
      reason: "network",
    });
  });
});
