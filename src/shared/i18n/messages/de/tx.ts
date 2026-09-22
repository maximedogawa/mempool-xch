import type { Translation } from "../../translate";
import type en from "../en/tx";

const messages: Translation<typeof en> = {
  heading: "Transaktion",
  retry: "Erneut versuchen",
  notAvailable: "k. A.",
  unknown: "unbekannt",
  noId: {
    title: "Keine Transaktions-ID",
    description:
      "Öffnen Sie eine Transaktion über die Übersicht oder fügen Sie eine ID in das Suchfeld ein.",
  },
  loadError: "Die Transaktion konnte nicht geladen werden",
  notFound: {
    title: "Transaktion nicht gefunden",
    coinset:
      "Im Mempool liegt kein ausstehendes Spend Bundle mit dieser ID, und Coinset kennt keine bestätigte oder verworfene Transaktion damit. Spend Bundles, die ohne Bestätigung aus dem Mempool entfernt wurden, bewahren Nodes nicht auf, daher können sie nicht angezeigt werden.",
    customNode:
      "Im Mempool liegt kein ausstehendes Spend Bundle mit dieser ID. Spend Bundles, die ohne Bestätigung aus dem Mempool entfernt wurden, bewahren Nodes nicht auf, daher können sie nicht angezeigt werden. Bestätigte Transaktionen lassen sich nur über einen Coinset-Endpunkt abfragen; suchen Sie mit einem eigenen Node stattdessen nach den Coin-IDs.",
  },
  pendingInIndex:
    "Im Index als ausstehend geführt. Wartet darauf, dass der Node das Spend Bundle liefert; Prüfung alle 10 Sekunden.",
  rawJson: {
    show: "Roh-JSON anzeigen",
    hide: "Roh-JSON ausblenden",
    spendBundle: "Spend Bundle",
    summary: "Transaktionszusammenfassung",
  },
  memos: {
    title: "Memos ({count})",
    binary: "binäres Memo (vermutlich ein Hint oder Puzzle-Hash)",
  },
  event: {
    title: "Ereignis {n}",
    via: "über {protocol}",
    participant: "Teilnehmer",
    sent: "Gesendet",
    received: "Empfangen",
    moreParticipants: {
      one: "…und {count} weiterer Teilnehmer (siehe Roh-JSON).",
      other: "…und {count} weitere Teilnehmer (siehe Roh-JSON).",
    },
    leg: "Teil {n}",
    legSent: "gesendet",
    legReceived: "empfangen",
    minted: "{type} gemintet <asset></asset>",
    melted: "{type} eingeschmolzen <asset></asset>",
  },
  summary: {
    title: "Zusammenfassung",
    hint: "Semantische Auswertung durch den Coinset-Indexer: wer welche Assets gesendet und empfangen hat.",
    noEvents: "Keine semantischen Ereignisse für diese Transaktion.",
  },
  stats: {
    fee: "Gebühr",
    zeroFeeSpend: "Ausgabe ohne Gebühr",
    cost: "Kosten",
    clvmCost: "{cost} CLVM-Kosten",
    costHint: "Gesamte CLVM-Kosten des Spend Bundles; ein Block fasst 11 Mrd. Kosten.",
    feePerCost: "Gebühr / Kosten",
    mojoPerCost: "Mojo pro Kosteneinheit",
    projectedBlock: "Voraussichtlicher Block",
    projectedPosition: "{eta} · Position {position} von {total}",
    notInSummary: "noch nicht im zusammengefassten Mempool",
    projectedHint:
      "Wo dieses Bundle landet, wenn der Mempool nach Gebühr pro Kosten in Blöcke mit 11 Mrd. Kosten gepackt wird.",
    block: "Block",
    dropped: "Verworfen",
    confirmations: {
      one: "{count} Bestätigung",
      other: "{count} Bestätigungen",
    },
    removedFromMempool: "aus dem Mempool entfernt",
    time: "Zeit",
    feeRate: "{rate} Mojo / Kosten",
    inferredCost: "aus der Chain abgeleitet (keine Kosten erfasst)",
    verdict: "Einschätzung",
  },
  pending: {
    line: "{coinSpends} · {removals} entfernt → {additions} hinzugefügt · bewegt <amount></amount><assets></assets> · aktualisiert sich live; alle 10 s neu geladen, solange ausstehend.",
    coinSpends: {
      one: "{count} Coin-Ausgabe",
      other: "{count} Coin-Ausgaben",
    },
    assets: {
      one: "Asset",
      other: "Assets",
    },
  },
  farmedBy: {
    line: "Gefarmt von <who></who> · <link>Blockdetails</link>",
    soloFarmer: "einem unbekannten Solo-Farmer",
    unidentifiedPool: "einem unbekannten Pool unter <address></address>",
  },
  firstSeen: "Zuerst im Mempool gesehen {age} ({date}).",
  waitedConfirming:
    "Wartete {duration} bis zur Bestätigung – basiert auf einer First-Seen-Stichprobe, nicht auf einem Konsensfakt.",
  waitedRemoved:
    "Wartete {duration}, bis sie entfernt wurde – basiert auf einer First-Seen-Stichprobe, nicht auf einem Konsensfakt.",
  coins: "Coins",
  coinSpends: {
    title: "Coin-Ausgaben ({count})",
    inferredHint:
      "Coinset hat dieses Bundle nie im Mempool gesehen; die Ausgaben sind aus dem Block rekonstruiert, in dem es landete, daher stammen Gebühr und Kosten aus dem Block.",
    lineMempool:
      "{spent} ausgegeben → {created} erstellt · {cost} Kosten · bewegt <amount></amount> · wie im Mempool gesehen",
    lineInferred:
      "{spent} ausgegeben → {created} erstellt · {cost} Kosten · bewegt <amount></amount> · aus dem Block rekonstruiert",
    coins: {
      one: "{count} Coin",
      other: "{count} Coins",
    },
  },
  flow: {
    inputs: "Eingänge · entfernt",
    outputs: "Ausgänge · hinzugefügt",
    none: "Keine",
    more: "…und {count} weitere (siehe Roh-JSON).",
    coin: "Coin <hash></hash>",
    srSummary:
      "{inputs} Eingänge mit insgesamt {totalIn} fließen in {outputs} Ausgänge mit insgesamt {totalOut}; Gebühr {fee}. Eingang {first}.",
  },
  verdict: {
    noCostLabel: "Keine Kosten erfasst",
    noCostDetail:
      "Diese Zusammenfassung wurde aus der Chain abgeleitet, daher sind Kosten und Gebührensatz nicht verfügbar.",
    share: "{percent} eines Blocks",
    noFeeLabel: "Keine Gebühr gezahlt",
    noFeeDetail:
      "Belegt {share}; der Farmer hat sie kostenlos aufgenommen, oder sie war klein genug, um trotzdem hineinzupassen.",
    paidDetail: "Belegt {share} bei diesem Gebührensatz.",
  },
};

export default messages;
