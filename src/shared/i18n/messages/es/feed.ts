import type { Translation } from "../../translate";
import type en from "../en/feed";

const messages: Translation<typeof en> = {
  latestTransactions: "Últimas transacciones",
  paused: "en pausa",
  mempoolLink: "Mempool →",
  empty: "El mempool está vacío.",
  costTitle: "{cost} de coste",
  zeroFee: "0 comisión",
  feeRate: "{rate} m/c",
  firstSeenTitle:
    "Visto por primera vez por el servidor de mempoolxch.space (no es la hora en que la red la vio por primera vez)",
  latestBlocks: "Últimos bloques",
  blocksLink: "Bloques →",
  txBlock: "bloque tx",
  noTx: "sin tx",
};

export default messages;
