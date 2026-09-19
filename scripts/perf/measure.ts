/**
 * Client performance measurement against a running production build (`bun run build &&
 * PORT=3210 bun run start`), live data, headless Chromium over CDP.
 *
 *   bun run perf -- --minutes 15 --routes /,/block,/map,/charts --out perf.json
 *   bun run perf -- --phase soak --routes /map --minutes 15     (one process per route to
 *                                                                 soak several in parallel)
 *
 * Two phases per route, each in a fresh browser:
 *  1. load: CPU 4x slowdown + "Fast 4G" network, cold cache. Reports JS transferred (up to the
 *     load event and in total), LCP and long tasks until the page settles.
 *  2. soak: no throttling, the tab stays open for --minutes. Reports the JS heap after a forced
 *     GC once per minute, DOM nodes, and long tasks while live updates arrive.
 *
 * `/block` resolves to the newest transaction block through the /blocks list.
 */
import { chromium, type Browser, type CDPSession, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

interface Args {
  base: string;
  routes: string[];
  minutes: number;
  phase: "load" | "soak" | "both";
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    base: get("base") ?? "http://localhost:3210",
    routes: (get("routes") ?? "/,/block,/map,/charts").split(","),
    minutes: Number(get("minutes") ?? 15),
    phase: (get("phase") as Args["phase"] | undefined) ?? "both",
    out: get("out") ?? null,
  };
}

const MB = 1024 * 1024;
const round = (n: number, digits = 1) => Number(n.toFixed(digits));

/** Collected inside the page: LCP and long tasks (PerformanceObserver, buffered). */
const OBSERVERS = `
  window.__perf = { lcp: 0, longTasks: [] };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      window.__perf.longTasks.push({ at: e.startTime, ms: e.duration });
  }).observe({ type: "longtask", buffered: true });
`;

interface PagePerf {
  lcp: number;
  longTasks: { at: number; ms: number }[];
}

function summariseLongTasks(tasks: PagePerf["longTasks"], sinceMs = 0) {
  const durations = tasks.filter((t) => t.at >= sinceMs).map((t) => t.ms);
  return {
    count: durations.length,
    over200: durations.filter((ms) => ms > 200).length,
    maxMs: round(Math.max(0, ...durations)),
    totalMs: round(durations.reduce((a, b) => a + b, 0)),
  };
}

async function resolveRoute(browser: Browser, base: string, route: string): Promise<string> {
  if (route !== "/block") return route;
  const page = await browser.newPage();
  await page.goto(`${base}/blocks`);
  const link = page.locator('a[href^="/block/"], a[href^="/block?id="]').first();
  await link.waitFor({ timeout: 60_000 });
  const href = (await link.getAttribute("href")) ?? "/blocks";
  await page.close();
  return href;
}

async function heap(cdp: CDPSession) {
  await cdp.send("HeapProfiler.collectGarbage");
  await cdp.send("HeapProfiler.collectGarbage");
  const { usedSize } = await cdp.send("Runtime.getHeapUsage");
  const { nodes, jsEventListeners } = await cdp.send("Memory.getDOMCounters");
  return { heapMb: round(usedSize / MB), domNodes: nodes, listeners: jsEventListeners };
}

async function measureLoad(base: string, route: string) {
  const browser = await chromium.launch();
  try {
    const path = await resolveRoute(browser, base, route);
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(OBSERVERS);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * MB) / 8,
      uploadThroughput: (0.75 * MB) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const types = new Map<string, string>();
    let jsBytes = 0;
    let cssBytes = 0;
    let scripts = 0;
    cdp.on("Network.responseReceived", (e) => {
      if (e.response.url.startsWith(base)) types.set(e.requestId, e.type);
    });
    cdp.on("Network.loadingFinished", (e) => {
      const type = types.get(e.requestId);
      if (type === "Script") {
        jsBytes += e.encodedDataLength;
        scripts += 1;
      } else if (type === "Stylesheet") cssBytes += e.encodedDataLength;
    });
    const started = Date.now();
    await page.goto(`${base}${path}`, { waitUntil: "load" });
    const loadMs = Date.now() - started;
    // What the first paint had to wait for; chunks split out with next/dynamic arrive later.
    const jsInitialKb = round(jsBytes / 1024);
    const firstProjected =
      route === "/"
        ? page
            .getByRole("list", { name: "Projected next blocks" })
            .getByRole("listitem")
            .first()
            .waitFor({ timeout: 180_000 })
            .then(() => Date.now() - started)
            .catch(() => null)
        : null;
    // Let the first data render and LCP settle.
    await page.waitForTimeout(12_000);
    const perf = (await page.evaluate("window.__perf")) as PagePerf;
    const nav = (await page.evaluate(
      "(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: n.domContentLoadedEventEnd, ttfb: n.responseStart }; })()"
    )) as { dcl: number; ttfb: number };
    const initialTotals = { jsKb: round(jsBytes / 1024), cssKb: round(cssBytes / 1024), scripts };
    // Dashboard only: when do the projected blocks show, on this first visit and on a reload
    // 20 s later (HTTP cache and localStorage warm, same throttling)?
    let projected: { firstVisitMs: number | null; reloadMs: number | null } | null = null;
    if (route === "/") {
      const cube = page
        .getByRole("list", { name: "Projected next blocks" })
        .getByRole("listitem")
        .first();
      const firstVisitMs = await firstProjected;
      await page.waitForTimeout(20_000);
      const reloaded = Date.now();
      await page.reload({ waitUntil: "commit" });
      const reloadMs = await cube
        .waitFor({ timeout: 180_000 })
        .then(() => Date.now() - reloaded)
        .catch(() => null);
      projected = { firstVisitMs, reloadMs };
    }
    return {
      path,
      projected,
      jsInitialKb,
      ...initialTotals,
      ttfbMs: round(nav.ttfb),
      dclMs: round(nav.dcl),
      loadMs,
      lcpMs: round(perf.lcp),
      longTasks: summariseLongTasks(perf.longTasks),
    };
  } finally {
    await browser.close();
  }
}

async function sample(page: Page, cdp: CDPSession, minute: number) {
  const h = await heap(cdp);
  const svgNodes = (await page.evaluate("document.querySelectorAll('svg *').length")) as number;
  return { minute, ...h, svgNodes };
}

async function measureSoak(base: string, route: string, minutes: number) {
  const browser = await chromium.launch();
  try {
    const path = await resolveRoute(browser, base, route);
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(OBSERVERS);
    const cdp = await context.newCDPSession(page);
    await page.goto(`${base}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(15_000);
    const samples = [await sample(page, cdp, 0)];
    for (let minute = 1; minute <= minutes; minute += 1) {
      await page.waitForTimeout(60_000);
      samples.push(await sample(page, cdp, minute));
      console.error(`${route} minute ${minute}: ${samples[minute]!.heapMb} MB`);
    }
    const perf = (await page.evaluate("window.__perf")) as PagePerf;
    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    // Growth over the second half of the run: a plateau reads ~0, a leak keeps climbing.
    const lateGrowthMb = round(last.heapMb - samples[Math.floor(samples.length / 2)]!.heapMb);
    return {
      path,
      minutes,
      heapAfterLoadMb: first.heapMb,
      heapEndMb: last.heapMb,
      heapPeakMb: Math.max(...samples.map((s) => s.heapMb)),
      lateGrowthMb,
      domNodesEnd: last.domNodes,
      svgNodesEnd: last.svgNodes,
      listenersEnd: last.listeners,
      // Long tasks after the first 15 s, i.e. during live updates rather than the initial load.
      liveLongTasks: summariseLongTasks(perf.longTasks, 15_000),
      samples,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const loads = [];
  // Load runs are sequential so CPU throttling is not distorted by the other tabs.
  if (args.phase !== "soak")
    for (const route of args.routes)
      loads.push({ route, ...(await measureLoad(args.base, route)) });
  console.table(
    loads.map(({ route, jsInitialKb, jsKb, cssKb, scripts, dclMs, lcpMs, longTasks }) => ({
      route,
      jsInitialKb,
      jsKb,
      cssKb,
      scripts,
      dclMs,
      lcpMs,
      longTasks: longTasks.count,
      longMaxMs: longTasks.maxMs,
    }))
  );
  // One route after the other: several Playwright browsers soaking in one bun process stall.
  const soaks = [];
  if (args.phase !== "load" && args.minutes > 0)
    for (const route of args.routes)
      soaks.push({ route, ...(await measureSoak(args.base, route, args.minutes)) });
  loads
    .filter((l) => l.projected)
    .forEach((l) =>
      console.log(
        `${l.route} projected blocks visible: first visit ${l.projected!.firstVisitMs} ms, reload ${l.projected!.reloadMs} ms`
      )
    );
  console.table(
    soaks.map((s) => ({
      route: s.route,
      heapLoadMb: s.heapAfterLoadMb,
      heapEndMb: s.heapEndMb,
      heapPeakMb: s.heapPeakMb,
      lateGrowthMb: s.lateGrowthMb,
      domNodes: s.domNodesEnd,
      svgNodes: s.svgNodesEnd,
      longTasks: s.liveLongTasks.count,
      over200: s.liveLongTasks.over200,
      longMaxMs: s.liveLongTasks.maxMs,
    }))
  );
  const result = { measuredAt: new Date().toISOString(), base: args.base, loads, soaks };
  if (args.out) writeFileSync(args.out, `${JSON.stringify(result, null, 2)}\n`);
}

void main();
