import type { Translation } from "../../translate";
import type en from "../en/fees";

const messages: Translation<typeof en> = {
  cards: {
    title: "Transaktionsgebühren",
    hint: "Chia-Gebühren werden pro CLVM-Kosteneinheit gezahlt, nicht pro Byte. Die Schätzungen gelten für eine Referenzausgabe mit {cost} Kosten (eine typische einfache XCH-Überweisung). Multiplizieren Sie den Satz in Mojo pro Kosteneinheit mit den Kosten Ihrer Ausgabe, um die Gebühr zu erhalten.",
    targets: {
      nextBlock: "Nächster Block",
      fiveMinutes: "~5 Minuten",
      tenMinutes: "~10 Minuten",
    },
    mojoPerCost: "Mojo/Kosten",
    notAvailable: "k. A.",
    capacityAvailable: "Kapazität verfügbar.",
    zeroFeeAccepted: "Ausgaben ohne Gebühr werden angenommen.",
    aboveToEnter: "Für die Aufnahme mehr als {rate} Mojo/Kosten nötig.",
    nearCapacity: "Nahezu ausgelastet.",
    fullMempool:
      "Ein voller Mempool nimmt Ausgaben erst ab 5 Mojo/Kosten an, und nur, wenn sie über den günstigsten Ausgaben liegen, die er verdrängen kann.",
    paidAhead: "Ausgaben mit Gebühr ziehen am gebührenfreien Rückstau vorbei.",
    lastBlock:
      "Der letzte Transaktionsblock zahlte {fees} an Gebühren bei {rate} Mojo/Kosten · aktueller Satz {current} Mojo/Kosten.",
  },
  page: {
    title: "Gebühren",
    intro:
      "Was der Node für eine Überweisung mit {cost} Kosten schätzt, die aktuelle Verteilung der Gebührensätze im Mempool und was gängige Ausgabeformen zum aktuellen Satz kosten. Bei Bedarf von Coinset gelesen, nichts wird auf unserem Server gespeichert.",
    nodeEstimate: "Schätzung des Nodes",
    withinMinutes: { one: "Innerhalb von {count} min", other: "Innerhalb von {count} min" },
    rateSub: "{rate} Mojo/Kosten",
    estimateNote:
      "get_fee_estimate bei {cost} Kosten. Eine Umrechnung in USD wird nicht angezeigt: Es gibt noch keinen verifizierten öffentlichen Endpunkt für Preisverläufe (dieselbe Lücke wie beim Markt-Diagramm unter /charts).",
    rateDistribution: "Verteilung der Gebührensätze",
    pendingBundles: { one: "{count} ausstehendes Bundle", other: "{count} ausstehende Bundles" },
    colRate: "Mojo/Kosten",
    colBundles: "Bundles",
    colCost: "Kosten",
    transferTitle: "Was eine Überweisung kostet",
    atCurrentRate: "zum aktuellen Satz, {rate} Mojo/Kosten",
    colSpend: "Ausgabe",
    colFee: "Gebühr",
    feesChart: {
      title: "Gebühren pro Transaktionsblock",
      definition: "Durchschnittliche Gesamtgebühren in einem Transaktionsblock.",
      technical:
        "Gemittelt pro Stichprobenfenster aus get_block_records (block_record.fees); begrenzte Anzahl an Fenstern unabhängig vom Zeitraum.",
    },
    medianChart: {
      title: "Median-Gebührensatz",
      definition: "Der mittlere Gebührensatz der Transaktionen in einem Block im Zeitverlauf.",
      technical:
        "Nicht im Diagrammmaßstab erfasst: Dafür wären die Kosten jeder einzelnen Transaktion pro Block nötig (ein indexierter Abruf pro Block), zu aufwendig für einen ganzen Zeitraum ohne serverseitigen Cache.",
      unavailable:
        "Nicht im Diagrammmaßstab erfasst – erfordert einen indexierten Abruf pro Block. Die Gebührensätze der Bundles im Mempool-Feed und auf den Transaktionsseiten sind exakt.",
    },
    footer:
      "Die an anderer Stelle gezeigten Sätze – im Mempool-Feed, auf Transaktions- und Blockseiten – sind exakte Werte pro Eintrag, keine Stichproben.",
  },
  transfers: {
    plain: "Einfache Überweisung",
    threeInputs: "Überweisung mit 3 Inputs",
    cat: "Einen CAT senden",
    nft: "Ein NFT übertragen",
    offer: "Ein Offer annehmen",
  },
};

export default messages;
