import type { Translation } from "../../translate";
import type en from "../en/blocksList";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Bloques",
  peak: "pico {height}",
  txOnly: "Solo bloques de transacciones",
  loadError: "No se pudieron cargar los bloques",
  height: "Altura",
  type: "Tipo",
  age: "Antigüedad",
  rewardClaims: "Cobros de recompensas",
  fees: "Comisiones",
  xchMoved: "XCH movidos",
  pool: "Pool",
  headerHash: "Hash de cabecera",
  txBlock: "bloque tx",
  noTx: "sin tx",
  poolTitle: "{pool} · pago {hash}",
  heights: "Alturas {from} – {to}",
  updating: " · actualizando…",
  newer: "Más recientes",
  latest: "Últimos",
  older: "Más antiguos",
};

export default messages;
