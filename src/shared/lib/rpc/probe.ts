/**
 * Does a nodexch gateway answer Coinset's indexed API? A nodexch runs with or without it (an
 * upstream's index, its own chain reader, or neither); without it every indexed method answers
 * 501 "index not enabled". One cheap indexed call decides, once per endpoint, so the indexed
 * features switch off instead of failing one by one.
 */
import { RpcError } from "./errors";

/**
 * The puzzle hash the probe asks the balance of: all zeros, which holds nothing. A balance is
 * what the indexed pages need (addresses, the portfolio, transactions); a gateway with an own
 * node derives it from the chain and keeps no reorg log, so `get_reorgs`, the earlier probe,
 * answered "index not enabled" there while balances worked, and switched them all off.
 */
export const INDEX_PROBE_P2 = "0".repeat(64);

/** The part of the client the probe uses. */
export interface IndexedProbeClient {
  getXchBalanceByP2: (p2: string, signal?: AbortSignal) => Promise<unknown>;
}

/**
 * `false` when the gateway says its index is off; `true` when it answers, and also on a
 * network error or a refusal of another kind, which say nothing about the index (the features
 * then fail or recover on their own, as with Coinset).
 */
export async function probeIndexed(
  client: IndexedProbeClient,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    await client.getXchBalanceByP2(INDEX_PROBE_P2, signal);
    return true;
  } catch (error) {
    if (!(error instanceof RpcError)) return true;
    const text = `${error.message} ${typeof error.detail === "string" ? error.detail : ""}`;
    return !(error.status === 501 || /index not enabled/i.test(text));
  }
}

/** The probe is an indexed call, the dearest kind on a metered gateway: its answer is kept. */
export const PROBE_TTL_MS = 60 * 60_000;
/** v2: the probe asks a balance; answers of the `get_reorgs` probe (v1) are not trusted. */
const PROBE_KEY = "mempool-xch:nodexch-index:v2";

type ProbeStorage = Pick<Storage, "getItem" | "setItem">;

/** The remembered answer for `rpcUrl`, or null when there is none or it is too old. */
export function loadProbe(storage: ProbeStorage | null, rpcUrl: string, now = Date.now()) {
  try {
    const raw = JSON.parse(storage?.getItem(PROBE_KEY) ?? "null") as {
      url?: unknown;
      on?: unknown;
      at?: unknown;
    } | null;
    if (!raw || raw.url !== rpcUrl || typeof raw.on !== "boolean" || typeof raw.at !== "number")
      return null;
    return now - raw.at < PROBE_TTL_MS && raw.at <= now ? raw.on : null;
  } catch {
    return null;
  }
}

export function saveProbe(
  storage: ProbeStorage | null,
  rpcUrl: string,
  on: boolean,
  now = Date.now()
): void {
  try {
    storage?.setItem(PROBE_KEY, JSON.stringify({ url: rpcUrl, on, at: now }));
  } catch {
    // A full or blocked storage only means the next load asks again.
  }
}
