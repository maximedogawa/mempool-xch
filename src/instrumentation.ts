/**
 * Next.js instrumentation hook: warms the mainnet mempool syncer when the server starts so the
 * first dashboard visitor gets a populated summary instead of waiting for the initial sync.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.MEMPOOL_NO_WARMUP === "1") return;
  try {
    const { getSyncer } = await import("@/server/mempoolSummary");
    void getSyncer("mainnet").getSummary();
  } catch {
    // Warm-up is best effort; the first request will sync instead.
  }
}
