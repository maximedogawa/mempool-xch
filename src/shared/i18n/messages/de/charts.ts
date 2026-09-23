import type { Translation } from "../../translate";
import type en from "../en/charts";

const messages: Translation<typeof en> = {
  title: "Diagramme",
  tooltipCoinset:
    "Datenreihen werden bei Bedarf aus Coinset erzeugt – auf unserem Server wird nichts gespeichert. Reihen, die noch kein Anbieter liefern kann, werden nicht aufgeführt.",
  tooltipCustom:
    "Datenreihen werden bei Bedarf aus Ihrem konfigurierten Endpunkt erzeugt – auf unserem Server wird nichts gespeichert. Reihen, die noch kein Anbieter liefern kann, werden nicht aufgeführt.",
  sections: {
    market: "Markt",
    mempool: "Mempool",
    blocks: "Blöcke",
    network: "Netzwerk",
  },
  card: {
    latest: "Aktuell",
    average: "Durchschnitt",
    highest: "Höchstwert",
    points: "Punkte",
    notEnoughData: "Noch nicht genug Daten.",
    definition: "Definition & technischer Hinweis",
  },
  controls: {
    range: "Zeitraum",
    smoothing: "Glättung",
    scale: "Skala",
    linear: "Linear",
    log: "Log",
  },
  notes: {
    sampledOnly:
      "Nur die letzten 2 Stunden werden in diesem Browser aufgezeichnet; wählen Sie 6h oder 24h, um sie zu sehen.",
    sameSample: "Dieselbe 2-Stunden-Browser-Stichprobe wie bei „Genutzte Kosten“.",
    perWindow: "Pro Stichprobenfenster aus get_block_records gezählt.",
    noNetspace:
      "Auf diesem Endpunkt nicht verfügbar: get_network_space hat für diesen Endpunkt nicht geantwortet.",
  },
  price: {
    title: "XCH-Preis (USDT)",
    definition: "Der XCH/USDT-Spotpreis im Zeitverlauf: der Schlusskurs jeder Kerze.",
    technical:
      "Öffentliche Spot-Kerzen von Gate.io für XCH_USDT, eine Anfrage pro Zeitraum (5-Minuten-Kerzen für 6h bis Wochenkerzen für „Alle“). USDT folgt dem US-Dollar eng, ist aber nicht dasselbe.",
    unavailable:
      "Der Preisverlauf von Gate.io hat nicht geantwortet. Er wird direkt aus diesem Browser abgerufen; versuchen Sie es später erneut.",
  },
  costUsed: {
    title: "Genutzte Kosten",
    definition: "Gesamte CLVM-Kosten aller ausstehenden Spend Bundles.",
    technical:
      "In diesem Browser bei jeder Aktualisierung der Mempool-Zusammenfassung aufgezeichnet; 2 Stunden lang aufbewahrt.",
    unavailable:
      "Nur die letzten 2 Stunden werden in diesem Browser aufgezeichnet (Coinset hat keinen Endpunkt für den Mempool-Verlauf); wählen Sie 6h oder 24h, um sie zu sehen.",
  },
  waitingBundles: {
    title: "Wartende Bundles",
    definition: "Spend Bundles, die im Mempool warten.",
  },
  totalFees: {
    title: "Gebühren gesamt",
    definition: "Summe der Gebühren aller ausstehenden Spend Bundles.",
  },
  medianFeeRate: {
    title: "Median-Gebührensatz",
    definition:
      "Der Gebührensatz in der Mitte der ausstehenden Kosten: Für die Hälfte der im Mempool wartenden Kosten wird mehr gezahlt, für die andere Hälfte weniger.",
    technical:
      "Zusammen mit den anderen Mempool-Reihen in diesem Browser erfasst: Die Bundles werden nach Gebührensatz (Mojo pro Kosteneinheit) sortiert, und der Satz bei der Hälfte der gesamten ausstehenden Kosten wird gespeichert. Nach Kosten gewichtet, daher ziehen einige große gebührenfreie Ausgaben ihn in Richtung 0.",
  },
  feesPerTxBlock: {
    title: "Gebühren pro Transaktionsblock",
    definition: "Durchschnittliche Gesamtgebühren in einem Transaktionsblock.",
    technical:
      "Pro Stichprobenfenster aus get_block_records (block_record.fees) gemittelt; begrenzte Anzahl an Fenstern unabhängig vom Zeitraum.",
  },
  costPerTxBlock: {
    title: "Kosten pro Transaktionsblock",
    definition:
      "Von einem Transaktionsblock verbrauchte CLVM-Kosten, von den 11 Milliarden, die ein Block erlaubt.",
    technical:
      "Für den neuesten Transaktionsblock jedes Stichprobenfensters: transactions_info.cost aus get_block. Ein Block pro Fenster (6 bis 24 je Zeitraum), jeder einmal pro Sitzung abgerufen.",
  },
  txBlocksPerHour: {
    title: "Transaktionsblöcke pro Stunde",
    definition: "Wie viele Blöcke im Fenster Transaktionen enthielten.",
  },
  spendsPerTxBlock: {
    title: "Ausgaben pro Transaktionsblock",
    definition: "In einem Transaktionsblock ausgegebene Coins.",
    technical:
      "Für dieselben Stichprobenblöcke wie bei „Kosten pro Transaktionsblock“: die Anzahl der Removals aus get_additions_and_removals. Belohnungs-Claims werden erzeugt, nicht ausgegeben, und zählen daher nicht.",
  },
  shareOfTxBlocks: {
    title: "Anteil der Transaktionsblöcke",
    definition: "Transaktionsblöcke als Anteil aller Blöcke (etwa ein Drittel).",
  },
  timeBetweenTxBlocks: {
    title: "Zeit zwischen Transaktionsblöcken",
    definition: "Durchschnittlicher Abstand zwischen aufeinanderfolgenden Transaktionsblöcken.",
    technical: "Pro Stichprobenfenster aus den Zeitstempeln von get_block_records gemittelt.",
  },
  netspace: {
    title: "Netspace",
    definition: "Geschätzter Gesamtspeicherplatz, der im Netzwerk farmt.",
    technical:
      "get_network_space zwischen dem ersten und letzten Block jedes Stichprobenfensters – die schwierigkeitsbasierte Schätzung des Nodes selbst, nicht von uns abgeleitet.",
  },
  difficulty: {
    title: "Schwierigkeit",
    definition: "Die Proof-of-Space-Schwierigkeit, mit der Blöcke gefarmt wurden.",
    technical:
      "Aus den Block-Records, die die anderen Reihen ohnehin abrufen: Das Gewicht eines Blocks ist die kumulierte Schwierigkeit der Chain, daher ist der Gewichtsschritt von einer Höhe zur nächsten die Schwierigkeit dieses Blocks. Median pro Stichprobenfenster. Sie ändert sich einmal pro Epoche (4.608 Blöcke).",
  },
  blocksPerHour: {
    title: "Blöcke pro Stunde",
    definition: "Alle Blöcke (mit und ohne Transaktionen) pro Stunde.",
  },
};

export default messages;
