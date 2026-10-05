import type { Page, Route } from "@playwright/test";

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

/** A handle the mock registry has, and one it does not. */
export const HANDLE = "mempoolxch";
export const FREE_HANDLE = "nobodyhasthisone";
export const HANDLE_P2 = "cd".repeat(32);
const LAUNCHER = "55".repeat(32);
/** Far enough out that the page never reads as expiring soon. */
const EXPIRATION = Math.floor(Date.now() / 1000) + 400 * 86_400;

/**
 * The XCHandles registry (api.xchandles.com) and MintGarden's handle record, in the shapes both
 * answered live on 2026-09-20. Only the registered handle resolves; everything else is a miss,
 * so a page that asks about an unregistered name is exercised too.
 */
export async function mockXchandles(page: Page) {
  await page.route("https://api.xchandles.com/handle/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.endsWith(`/handle/${HANDLE}`))
      return json(route, { code: "handle_not_found", message: "no live slot" }, 404);
    return json(route, {
      registry_launcher_id: "6f".repeat(32),
      handle: HANDLE,
      slot: {
        counter: 0,
        handle_hash: "3a".repeat(32),
        expiration: EXPIRATION,
        owner_launcher_id: LAUNCHER,
        resolved_launcher_id: LAUNCHER,
      },
      slot_confirmation_height: 9_318_814,
      resolved_singleton: {
        launcher_id: LAUNCHER,
        amount: 1,
        melted: false,
        nft: { p2_puzzle_hash: HANDLE_P2, royalty_basis_points: 500 },
      },
      indexed_peak_height: 9_318_913,
      pending_transfer: null,
    });
  });
  await page.route("https://api.xchandles.com/registrations/**", (route) =>
    json(route, {
      handle: HANDLE,
      action_kind: "register",
      protocol_fee: 10_000,
      confirmation_height: 9_318_814,
      indexed_peak_height: 9_318_913,
    })
  );
  await page.route("https://api.mintgarden.io/xchandles/**", (route) =>
    json(route, {
      handle: HANDLE,
      status: "active",
      nft: {
        launcher_id: LAUNCHER,
        encoded_id: "nft1250ut0lq7v8d06n0ytvfygdvns04lczn7c3g90uz2lzmkmk53keq74gyyl",
        encoded_address: "xch1testhandleaddress",
        thumbnail_uri: null,
      },
    })
  );
}
