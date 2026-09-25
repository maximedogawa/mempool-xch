/**
 * Does a nodexch gateway answer Coinset's indexed API? A nodexch runs with or without it (an
 * upstream's index, its own chain reader, or neither); without it every indexed method answers
 * 501 "index not enabled". One cheap indexed call decides, once per endpoint, so the indexed
 * features switch off instead of failing one by one.
 */
import { RpcError } from "./errors";

/** The part of the client the probe uses. */
export interface IndexedProbeClient {
  getReorgs: (opts: { limit?: number }, signal?: AbortSignal) => Promise<unknown>;
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
    await client.getReorgs({ limit: 1 }, signal);
    return true;
  } catch (error) {
    if (!(error instanceof RpcError)) return true;
    const text = `${error.message} ${typeof error.detail === "string" ? error.detail : ""}`;
    return !(error.status === 501 || /index not enabled/i.test(text));
  }
}
