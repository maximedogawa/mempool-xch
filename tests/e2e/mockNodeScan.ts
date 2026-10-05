import type { Page, Route } from "@playwright/test";

const json = (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

/** Deterministic node addresses: two in Germany, one in the US, one GeoJS cannot place, one IPv6. */
export const SEED_NODES = {
  berlin1: "203.0.113.10",
  berlin2: "203.0.113.11",
  sanFrancisco: "198.51.100.7",
  unplaced: "192.0.2.99",
  v6: "2001:db8::1",
};

const GEO: Record<string, unknown> = {
  [SEED_NODES.berlin1]: {
    ip: SEED_NODES.berlin1,
    country: "Germany",
    country_code: "DE",
    city: "Berlin",
    latitude: "52.52",
    longitude: "13.405",
    organization_name: "Example Telekom",
  },
  [SEED_NODES.berlin2]: {
    ip: SEED_NODES.berlin2,
    country: "Germany",
    country_code: "DE",
    city: "Berlin",
    latitude: "52.55",
    longitude: "13.38",
    organization_name: "Example Telekom",
  },
  [SEED_NODES.sanFrancisco]: {
    ip: SEED_NODES.sanFrancisco,
    country: "United States",
    country_code: "US",
    city: "San Francisco",
    latitude: "37.77",
    longitude: "-122.42",
  },
  [SEED_NODES.unplaced]: { ip: SEED_NODES.unplaced, latitude: "nil", longitude: "nil" },
  [SEED_NODES.v6]: {
    ip: SEED_NODES.v6,
    country: "Germany",
    country_code: "DE",
    city: "Hamburg",
    latitude: "53.55",
    longitude: "9.99",
  },
  /** The status page's probe address. */
  "8.8.8.8": {
    ip: "8.8.8.8",
    country: "United States",
    country_code: "US",
    latitude: "37.751",
    longitude: "-97.822",
    organization_name: "Google LLC",
  },
};

/**
 * Mocks the two external sources of the network map: DNS-over-HTTPS seeder answers (Cloudflare,
 * with Google as the fallback) and GeoJS batch geolocation. Every A query returns the same four
 * IPv4 nodes, every AAAA query the one IPv6 node.
 */
export async function mockNodeScan(page: Page) {
  const answer = (type: "A" | "AAAA") =>
    type === "A"
      ? [SEED_NODES.berlin1, SEED_NODES.berlin2, SEED_NODES.sanFrancisco, SEED_NODES.unplaced].map(
          (data) => ({ name: "dns-introducer.chia.net.", type: 1, TTL: 300, data })
        )
      : [{ name: "dns-introducer.chia.net.", type: 28, TTL: 300, data: SEED_NODES.v6 }];
  const doh = (route: Route) => {
    const type = new URL(route.request().url()).searchParams.get("type") === "AAAA" ? "AAAA" : "A";
    return json(route, { Status: 0, Answer: answer(type) });
  };
  await page.route("https://cloudflare-dns.com/dns-query**", doh);
  await page.route("https://dns.google/resolve**", doh);
  await page.route("https://get.geojs.io/v1/ip/geo.json**", (route) => {
    const ips = (new URL(route.request().url()).searchParams.get("ip") ?? "")
      .split(",")
      .filter(Boolean);
    return json(
      route,
      ips.map((ip) => GEO[ip] ?? { ip, latitude: "nil", longitude: "nil" })
    );
  });
}
