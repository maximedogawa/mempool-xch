import type { Translation } from "../../translate";
import type en from "../en/mempoolList";

const messages: Translation<(typeof en)["messages"]> = {
  spendBundles: "Spend bundles",
  summarised: "{count} resumidos",
  costUsed: "Coste usado",
  costOf: "{used} de {max}",
  totalFees: "Comisiones totales",
  updated: "Actualizado",
  source: {
    server: "API de resumen",
    snapshot: "de tu última visita, sincronizando",
    syncing: "primera sincronización en curso",
    node: "directo del nodo",
  },
  pendingTitle: "Spend bundles pendientes",
  updating: "actualizando…",
  live: "en vivo",
  loadError: "No se pudo cargar la mempool",
  emptyTitle: "La mempool está vacía",
  emptyDescription: "Todos los spend bundles se han incluido en un bloque.",
  columns: {
    txId: "ID de tx",
    kind: "Tipo",
    value: "Valor",
    feeRate: "Comisión / coste",
    fee: "Comisión",
    cost: "Coste",
    age: "Antigüedad",
  },
  firstSeenTitle: "Detectado por primera vez por el servidor de mempoolxch.space",
  showing: "Mostrando {shown} de {total}",
  showMore: "Mostrar más",
};

export default messages;
