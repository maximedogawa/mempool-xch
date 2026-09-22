import { describe, expect, test } from "bun:test";
import { parseDashboardBreakdown, parseDashboardMetric, parseGrafanaSeries } from "./dashboard";

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
});
