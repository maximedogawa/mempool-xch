import type { Translation } from "../../translate";
import type en from "../en/blocksList";

const messages: Translation<typeof en> = {
  title: "Blöcke",
  peak: "Spitze {height}",
  txOnly: "Nur Transaktionsblöcke",
  loadError: "Blöcke konnten nicht geladen werden",
  height: "Höhe",
  type: "Typ",
  age: "Alter",
  rewardClaims: "Belohnungs-Claims",
  fees: "Gebühren",
  xchMoved: "XCH bewegt",
  pool: "Pool",
  headerHash: "Header-Hash",
  txBlock: "Tx-Block",
  noTx: "keine Tx",
  poolTitle: "{pool} · Auszahlung {hash}",
  heights: "Höhen {from} – {to}",
  updating: " · wird aktualisiert…",
  newer: "Neuer",
  latest: "Neueste",
  older: "Älter",
};

export default messages;
