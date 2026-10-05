import { describe, expect, test } from "bun:test";
import { normaliseTxSummary } from "@/shared/lib/rpc/normalise";
import type { TxSummary } from "@/shared/lib/rpc/types";
import selfClaimFixture from "@/test-utils/fixtures/pool_claim_self_tx.json";
import claimFixture from "@/test-utils/fixtures/pool_claim_tx.json";
import { claimsFromTransaction, resolveClaims, type PoolClaim } from "./claims";

// Recorded from Coinset's get_transaction: a Spacefarmers.io claim (height 9301254) and a
// self-pooling PlotNFT collecting its own reward (height 8762966).
const poolClaimTx = normaliseTxSummary(claimFixture.transaction);
const selfClaimTx = normaliseTxSummary(selfClaimFixture.transaction);

const FARMER_PAYOUT = "cabeeede115c96d3bd78f05c46f2d0cb0cfefdaa364f419d69436ad7b7b84bba";
const SPACEFARMERS_TARGET = "61751cc01a73d5e64a07d6e37b451eed9f157f04da53e3c7d06f355928ba2113";
const SELF_PAYOUT = "ab14af9c3ed5eebe19d2ca15586bac0b85dabd3c640055bee1685e466a348adc";
const SELF_TARGET = "718848ccc0fd9c47d8100bbf19e2ba24793559f0b68616d631901b21fb895dad";

describe("claimsFromTransaction", () => {
  test("a pool's claim maps the farmer's PlotNFT address to the pool's target", () => {
    const claims = claimsFromTransaction(poolClaimTx);
    expect(claims.get(FARMER_PAYOUT)).toEqual({ target: SPACEFARMERS_TARGET, selfPooled: false });
    // The pool's own fee-paying wallet spend in the same bundle is not a claim.
    expect(claims.size).toBe(1);
  });

  test("a self-pooling PlotNFT's claim is flagged as such", () => {
    expect(claimsFromTransaction(selfClaimTx).get(SELF_PAYOUT)).toEqual({
      target: SELF_TARGET,
      selfPooled: true,
    });
  });

  test("an ambiguous destination is not a claim", () => {
    const event = poolClaimTx.events[0]!;
    const reward = event.outputs.find((o) => o.puzzleHash === SPACEFARMERS_TARGET)!;
    const tx: TxSummary = {
      ...poolClaimTx,
      events: [
        { ...event, outputs: [...event.outputs, { ...reward, puzzleHash: "f".repeat(64) }] },
      ],
    };
    expect(claimsFromTransaction(tx).size).toBe(0);
  });

  test("an ordinary wallet spend is not a claim", () => {
    const tx: TxSummary = { ...poolClaimTx, events: [poolClaimTx.events[1]!] };
    expect(claimsFromTransaction(tx).size).toBe(0);
  });
});

describe("resolveClaims", () => {
  const run = async (
    payouts: string[],
    fetchLatestTransaction: (payout: string) => Promise<TxSummary | null>
  ) => {
    const resolved = new Map<string, PoolClaim>();
    const failed: string[] = [];
    await resolveClaims({
      payouts,
      fetchLatestTransaction,
      onResolved: (claims) => claims.forEach((claim, hash) => resolved.set(hash, claim)),
      onFailed: (payout) => failed.push(payout),
      signal: new AbortController().signal,
      concurrency: 1,
      retryDelayMs: 0,
    });
    return { resolved, failed };
  };

  test("an address settled by an earlier batched claim is not looked up again", async () => {
    const asked: string[] = [];
    const bystander = "b".repeat(64);
    const batched: TxSummary = {
      ...poolClaimTx,
      events: [
        poolClaimTx.events[0]!,
        {
          ...poolClaimTx.events[0]!,
          inputs: poolClaimTx.events[0]!.inputs.map((i) =>
            i.puzzleHash === FARMER_PAYOUT ? { ...i, puzzleHash: bystander } : i
          ),
        },
      ],
    };
    const { resolved } = await run([FARMER_PAYOUT, bystander], async (payout) => {
      asked.push(payout);
      return batched;
    });
    expect(asked).toEqual([FARMER_PAYOUT]);
    expect(resolved.get(bystander)?.target).toBe(SPACEFARMERS_TARGET);
  });

  test("no transaction, or one that is not a claim, settles the address as unclaimed", async () => {
    const wallet = "c".repeat(64);
    const { resolved } = await run([SELF_PAYOUT, wallet], async (payout) =>
      payout === wallet ? poolClaimTx : null
    );
    expect(resolved.get(SELF_PAYOUT)).toEqual({ target: null, selfPooled: false });
    expect(resolved.get(wallet)).toEqual({ target: null, selfPooled: false });
  });

  test("a failed lookup is retried once, then reported and left unresolved", async () => {
    let calls = 0;
    const flaky = await run([FARMER_PAYOUT], async () => {
      calls += 1;
      if (calls === 1) throw new Error("HTTP 429");
      return poolClaimTx;
    });
    expect(flaky.resolved.get(FARMER_PAYOUT)?.target).toBe(SPACEFARMERS_TARGET);

    const down = await run([FARMER_PAYOUT], async () => {
      throw new Error("HTTP 429");
    });
    expect(down.failed).toEqual([FARMER_PAYOUT]);
    expect(down.resolved.size).toBe(0);
  });

  test("stops asking once aborted", async () => {
    const controller = new AbortController();
    const asked: string[] = [];
    await resolveClaims({
      payouts: [FARMER_PAYOUT, SELF_PAYOUT],
      fetchLatestTransaction: async (payout) => {
        asked.push(payout);
        controller.abort();
        return null;
      },
      onResolved: () => {
        throw new Error("nothing resolves after an abort");
      },
      signal: controller.signal,
      concurrency: 1,
    });
    expect(asked).toEqual([FARMER_PAYOUT]);
  });
});
