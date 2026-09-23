/** Route-level client components under src/app (detail routes without a valid id). */
import { defineNamespace } from "../../translate";

const messages = {
  invalidCoin: {
    title: "Invalid coin id",
    description: "A coin id is 32 bytes of hex, with or without a 0x prefix.",
  },
  invalidTx: {
    title: "Invalid transaction id",
    description: "A transaction (spend bundle) id is 32 bytes of hex, with or without a 0x prefix.",
  },
  noBlock: {
    title: "No block selected",
    description: "Search for a block height or header hash.",
  },
};

export default defineNamespace("app", messages);
