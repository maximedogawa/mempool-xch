import { describe, expect, test } from "bun:test";
import offerState from "@/test-utils/fixtures/offer_state.json";
import offersByCat from "@/test-utils/fixtures/offers_by_cat.json";
import rawTxXch from "@/test-utils/fixtures/raw_tx_xch.json";
import reorgs from "@/test-utils/fixtures/reorgs.json";
import { createRpcClient, type FetchLike } from "./client";
import { RpcError } from "./errors";
import { normaliseClawbackList, normaliseOfferList, normaliseOfferState, normaliseRawTransaction, normaliseReorgList } from "./normalise";

describe("offers", () => {
  test("a confirmed CAT-for-XCH offer keeps both sides and the settlement", () => {
    const o = normaliseOfferState(offerState.state);
    expect(o.offerId).toBe("e86a565172a26530728edf9712a34cfb103e1f1395710a6c181c495b4e2ccca5");
    expect(o.status).toBe("confirmed");
    expect(o.offered.cats).toEqual([{ assetId: "db1a9020d48d9d4ad22631b66ab4b9ebd3637ef7758ad38881348c5d24c38f20", amount: 5_000_000n }]);
    expect(o.offered.xch).toBe(0n);
    expect(o.requested.xch).toBe(60_000_000_000_000n);
    expect(o.requested.cats).toEqual([]);
    expect(o.makerP2s).toHaveLength(4);
    expect(o.confirmedTxId).toBe("27c9fe216b056e231d35bf0466920ec102516ce4fe1f01e6868073ab9a0d55d5");
    expect(o.confirmedHeight).toBe(9308382);
    expect(o.cancelledByTxId).toBeNull();
  });

  test("lists carry the cursor and unknown statuses fall back to open", () => {
    const list = normaliseOfferList(offersByCat);
    expect(list.offers).toHaveLength(2);
    expect(list.offers[1]?.feeMojos).toBe(261_581_383n);
    expect(list.truncated).toBe(true);
    expect(typeof list.nextCursor).toBe("string");
    expect(normaliseOfferState({ offer_id: "0xab", status: "weird" }).status).toBe("open");
  });
});

describe("clawbacks and reorgs", () => {
  test("clawback coins", () => {
    const list = normaliseClawbackList({
      clawbacks: [{ coin_id: "0xaa", receiver_p2: "0xbb", sender_p2: "0xcc", seconds: 86400, amount: "1000", asset_kind: "cat", asset_id: "0xdd", revocable: true }],
      truncated: false,
    });
    expect(list.clawbacks[0]).toEqual({ coinId: "aa", receiverP2: "bb", senderP2: "cc", seconds: 86400, amount: 1000n, assetKind: "cat", assetId: "dd", revocable: true });
    expect(normaliseClawbackList({}).clawbacks).toEqual([]);
  });

  test("reorg events newest first with depth", () => {
    const list = normaliseReorgList(reorgs);
    expect(list.reorgs).toHaveLength(3);
    expect(list.reorgs[0]).toMatchObject({ oldPeakHeight: 9306355, newPeakHeight: 9306354, depth: 1 });
    expect(list.reorgs[0]?.oldPeakHash).toHaveLength(64);
    expect(list.reorgs[0]!.detectedAtMs > list.reorgs[1]!.detectedAtMs).toBe(true);
  });

  test("raw transaction wraps a mempool item", () => {
    const raw = normaliseRawTransaction(rawTxXch);
    expect(raw.source).toBe("mempool");
    expect(raw.item.spendBundle.coinSpends.length).toBeGreaterThan(0);
    expect(raw.item.additions.length).toBeGreaterThan(0);
  });
});

describe("client", () => {
  const fetchImpl: FetchLike = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    if (url.endsWith("/get_offer")) {
      if (body.offer_id === "00") return new Response(JSON.stringify({ success: false, error: "Key not found: offer_state/00" }));
      return new Response(JSON.stringify(offerState));
    }
    if (url.endsWith("/get_offers_by_p2")) return new Response(JSON.stringify({ ...offersByCat, p2: body.p2, status: body.status }));
    if (url.endsWith("/get_reorgs")) return new Response(JSON.stringify(reorgs));
    if (url.endsWith("/get_raw_transaction_by_id")) return new Response(JSON.stringify(rawTxXch));
    return new Response("nope", { status: 404 });
  };
  const client = createRpcClient({ rpcUrl: "https://node", indexedUrl: "https://node", fetchImpl });

  test("offer lookups strip 0x, default to descending order and surface not-found", async () => {
    const offer = await client.getOffer("0xE86A565172a26530728edf9712a34cfb103e1f1395710a6c181c495b4e2ccca5".toLowerCase());
    expect(offer.status).toBe("confirmed");
    const list = await client.getOffersByP2("bacd0883be47be1d6b8b0237521f4fade83683911aeacd63633df615b4a984db", "confirmed");
    expect(list.offers).toHaveLength(2);
    await expect(client.getOffer("00")).rejects.toMatchObject({ kind: "not_found" } satisfies Partial<RpcError>);
  });

  test("reorgs and raw transactions", async () => {
    expect((await client.getReorgs({ limit: 3 })).reorgs).toHaveLength(3);
    expect((await client.getRawTransactionById("abc")).item.removals.length).toBeGreaterThan(0);
  });

  test("everything is refused without an indexed endpoint", async () => {
    const custom = createRpcClient({ rpcUrl: "https://node", indexedUrl: null, fetchImpl });
    await expect(custom.getReorgs()).rejects.toBeInstanceOf(RpcError);
    await expect(custom.getOffer("ab")).rejects.toBeInstanceOf(RpcError);
  });
});
