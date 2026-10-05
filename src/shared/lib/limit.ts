/** FIFO concurrency gate. Queued cancellations release their closures immediately. */
export function createLimiter(max: number) {
  if (!Number.isInteger(max) || max < 1) throw new RangeError("Concurrency must be positive");
  let active = 0;
  const queue: (() => void)[] = [];
  const drain = () => {
    while (active < max && queue.length) queue.shift()!();
  };
  return function limited<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      const onAbort = () => {
        const index = queue.indexOf(start);
        if (index >= 0) queue.splice(index, 1);
        reject(signal!.reason);
      };
      const start = () => {
        signal?.removeEventListener("abort", onAbort);
        // Reserve the slot synchronously, before any other caller can enter.
        active++;
        void Promise.resolve()
          .then(() => {
            signal?.throwIfAborted();
            return fn();
          })
          .then(resolve, reject)
          .finally(() => {
            active--;
            drain();
          });
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      queue.push(start);
      drain();
    });
  };
}
