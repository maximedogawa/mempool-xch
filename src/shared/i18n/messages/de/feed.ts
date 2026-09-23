import type { Translation } from "../../translate";
import type en from "../en/feed";

const messages: Translation<typeof en> = {
  latestTransactions: "Neueste Transaktionen",
  paused: "pausiert",
  mempoolLink: "Mempool →",
  empty: "Der Mempool ist leer.",
  costTitle: "{cost} Kosten",
  zeroFee: "0 Gebühr",
  feeRate: "{rate} m/c",
  firstSeenTitle:
    "Zuerst vom mempoolxch.space-Server beobachtet (nicht der Zeitpunkt, zu dem das Netzwerk sie zuerst sah)",
  latestBlocks: "Neueste Blöcke",
  blocksLink: "Blöcke →",
  txBlock: "Tx-Block",
  noTx: "keine Tx",
};

export default messages;
