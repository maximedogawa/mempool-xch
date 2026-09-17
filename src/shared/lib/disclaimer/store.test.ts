import { describe, expect, test } from "bun:test";
import { createDisclaimerStore, DISCLAIMER_KEY } from "./store";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

describe("disclaimer store", () => {
  test("shown until dismissed, then persisted and notified", () => {
    const storage = memoryStorage();
    const store = createDisclaimerStore(storage);
    expect(store.get()).toEqual({ dismissed: false });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.dismiss();
    expect(notified).toBe(1);
    expect(store.get()).toEqual({ dismissed: true });
    expect(storage.data.get(DISCLAIMER_KEY)).toBe("1");
  });

  test("dismissing twice notifies only once", () => {
    const store = createDisclaimerStore(memoryStorage());
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.dismiss();
    store.dismiss();
    expect(notified).toBe(1);
  });

  test("stays dismissed across reloads", () => {
    const storage = memoryStorage({ [DISCLAIMER_KEY]: "1" });
    const store = createDisclaimerStore(storage);
    expect(store.get()).toEqual({ dismissed: true });
  });

  test("keeps working without storage", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const store = createDisclaimerStore(throwing);
    expect(store.get().dismissed).toBe(false);
    store.dismiss();
    expect(store.get().dismissed).toBe(true);
  });
});
