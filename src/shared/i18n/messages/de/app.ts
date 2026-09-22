import type { Translation } from "../../translate";
import type en from "../en/app";

const messages: Translation<typeof en> = {
  invalidCoin: {
    title: "Ungültige Coin-ID",
    description: "Eine Coin-ID besteht aus 32 Byte Hex, mit oder ohne 0x-Präfix.",
  },
  invalidTx: {
    title: "Ungültige Transaktions-ID",
    description:
      "Eine Transaktions-ID (Spend Bundle) besteht aus 32 Byte Hex, mit oder ohne 0x-Präfix.",
  },
  noBlock: {
    title: "Kein Block ausgewählt",
    description: "Suchen Sie nach einer Blockhöhe oder einem Header-Hash.",
  },
};

export default messages;
