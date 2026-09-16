/**
 * Tiny concurrency gate: at most `max` callers run at once, the rest wait in FIFO order.
 * Used for fan-out browser calls against Coinset (one indexed request per recent block)
 * so a dashboard load does not fire a dozen requests in the same instant; Coinset answers
 * bursts with error pages that carry no CORS headers, which the browser reports as CORS
 * failures.
 */
export function createLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    active -= 1;
    queue.shift()?.();
  };
  return async function limited<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => queue.push(resolve));
    active += 1;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}
