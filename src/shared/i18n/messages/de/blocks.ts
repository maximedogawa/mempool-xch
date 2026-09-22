import type { Translation } from "../../translate";
import type en from "../en/blocks";

const messages: Translation<typeof en> = {
  row: {
    label: "Blöcke",
    projected: "Voraussichtlich · nächste Blöcke",
    confirmed: "Bestätigt · letzte Transaktionsblöcke",
  },
  projected: {
    emptyLabel: "Der Mempool ist leer: Der nächste Block wird keine Transaktionen enthalten",
    empty: "Leer",
    mempool: "Mempool",
    listLabel: "Voraussichtliche nächste Blöcke",
    cubeLabel:
      "Voraussichtlicher Block {n}: {bundles}{yours}{watched}, {percent} % voll, Gebührensatz {min} bis {max} mojo pro Kosteneinheit, {eta}",
    bundles: { one: "{count} Spend Bundle", other: "{count} Spend Bundles" },
    yoursPart: ", {count} von Ihnen",
    watchedPart: ", {count} beobachtet",
    nextBlock: "Nächster Block",
    zeroFee: "0 Gebühr",
    txCount: "{count} Tx · {cost}",
    yours: "{count} von Ihnen",
    inEta: "In {eta}",
  },
  details: {
    title: "Voraussichtlicher Block {n} · {bundles} · {cost} Kosten · {eta}",
    bundles: { one: "{count} Spend Bundle", other: "{count} Spend Bundles" },
    close: "Schließen",
    closeLabel: "Details des voraussichtlichen Blocks schließen",
    txId: "Tx-ID",
    kind: "Art",
    fee: "Gebühr",
    cost: "Kosten",
    feePerCost: "Gebühr / Kosten",
    value: "Wert",
    seen: "Gesehen",
    showingFirst:
      "Die ersten {shown} von {total} werden angezeigt. <link>Vollständige Mempool-Tabelle öffnen</link>.",
  },
  recent: {
    listLabel: "Letzte Transaktionsblöcke",
    cubeLabel: "Block {height}{watched}, {age}, Gebühren {fees}, {farmer}",
    watchedPart: ", {count} beobachtet",
    farmedByPool: "gefarmt von {pool}",
    farmerHash: "Farmer {hash}",
    totalFees: "Gebühren gesamt",
    moved: "{amount} bewegt",
    rewardClaims: { one: "{count} Belohnungsabholung", other: "{count} Belohnungsabholungen" },
    poolTitle: "{pool} · Farmer {hash}",
    farmerTitle: "Farmer {hash}",
    gap: {
      one: "{count} Nicht-Transaktionsblock zwischen {newer} und {older} (ohne Ausgaben)",
      other: "{count} Nicht-Transaktionsblöcke zwischen {newer} und {older} (ohne Ausgaben)",
    },
    empty: "Keine Transaktionsblöcke im aktuellen Zeitfenster (je {cost} Kosten).",
  },
  reorgs: {
    title: "Reorg-Verlauf",
    hint: "Ein Reorg ersetzt den oder die jüngsten Blöcke durch eine konkurrierende Chain. Reorgs bei Chia sind meist nur einen Block tief und harmlos; eine Transaktion in einem reorganisierten Block wird einfach einen Block später erneut aufgenommen.",
    mostRecent: "Die {count} jüngsten, wie von Coinset erkannt",
    empty: "Keine Reorgs erfasst.",
    detected: "Erkannt",
    depth: "Tiefe",
    rolledBackTo: "Zurückgesetzt auf",
    oldPeak: "Alte Spitze",
    newPeak: "Neue Spitze",
    depthValue: { one: "{count} Block", other: "{count} Blöcke" },
    from: "von #{height}",
  },
};

export default messages;
