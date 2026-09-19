import { describe, expect, test } from "bun:test";
import { crossExchange, parseGateBook, parseHtxBook, parseOkxBook, spread } from "./orderbook";

describe("market order books", () => {
  test("parses exchange shapes and sorts without floating point price math", () => {
    const gate = parseGateBook({ bids: [["1.52", "2"]], asks: [["1.54", "3"]] }, "USDT", 1);
    const okx = parseOkxBook(
      { data: [{ bids: [["1.51", "4", "0", "1"]], asks: [["1.55", "5", "0", "1"]] }] },
      "USDT",
      1
    );
    const htx = parseHtxBook({ tick: { bids: [[1.5, 2]], asks: [[1.56, 2]] } }, "USDT", 1);
    expect(gate.bids[0]).toMatchObject({ price: 1.52, priceScaled: 152000000n, amount: 2 });
    expect(spread(gate)).toEqual({
      absolute: 0.02,
      percent: expect.closeTo(1.30718954248366, 10),
    });
    expect(crossExchange([gate, okx, htx]).bid?.price).toBe(1.52);
    expect(crossExchange([gate, okx, htx]).ask?.price).toBe(1.54);
  });

  test("ignores malformed and non-positive levels", () => {
    const book = parseGateBook(
      {
        bids: [
          ["bad", 1],
          [0, 2],
          ["1.2", "3"],
        ],
        asks: null,
      },
      "USDT",
      1
    );
    expect(book.bids[0]).toMatchObject({ price: 1.2, priceScaled: 120000000n, amount: 3 });
    expect(book.asks).toEqual([]);
  });
});
