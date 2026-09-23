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
    coinSet: "Coin-Set",
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
    noCoinset:
      "Die indexierte API von Coinset hat hierfür keinen Aggregat-Endpunkt (geprüft anhand ihrer OpenAPI-Spezifikation); ein künftiger Anbieter wie nodexch könnte ihn ergänzen.",
    needsCoinsetAggregate: "Bräuchte einen Aggregat-Endpunkt von Coinset.",
    sampledOnly:
      "Nur die letzten 2 Stunden werden in diesem Browser aufgezeichnet; wählen Sie 6h oder 24h, um sie zu sehen.",
    sameSample: "Dieselbe 2-Stunden-Browser-Stichprobe wie bei „Genutzte Kosten“.",
    perWindow: "Pro Stichprobenfenster aus get_block_records gezählt.",
    noNetspace:
      "Auf diesem Endpunkt nicht verfügbar: get_network_space hat für diesen Endpunkt nicht geantwortet.",
  },
  price: {
    title: "XCH-Preis (USD)",
    definition: "Der XCH/USD-Spotpreis im Zeitverlauf.",
    technical: "Käme aus den Preisdaten von Dexie.",
    unavailable:
      "Noch kein geprüfter öffentlicher Endpunkt für den Preisverlauf. Die Sage-Wallet zeigt bei Verbindung einen Live-Spotpreis in der Kopfzeile; dieses Diagramm braucht einen Verlauf, für den Dexie derzeit keinen dokumentierten Endpunkt veröffentlicht.",
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
    definition: "Der mittlere Gebührensatz der ausstehenden Spend Bundles.",
    technical:
      "Wird von der Browser-Aufzeichnung noch nicht erfasst (sie speichert Summen pro Gebührenband, nicht die vollständige Verteilung).",
    unavailable:
      "Noch nicht aufgezeichnet: Der Mempool-Verlauf speichert Summen pro Gebührenband, was für einen Median nicht reicht.",
  },
  feesPerTxBlock: {
    title: "Gebühren pro Transaktionsblock",
    definition: "Durchschnittliche Gesamtgebühren in einem Transaktionsblock.",
    technical:
      "Pro Stichprobenfenster aus get_block_records (block_record.fees) gemittelt; begrenzte Anzahl an Fenstern unabhängig vom Zeitraum.",
  },
  costPerTxBlock: {
    title: "Kosten pro Transaktionsblock",
    definition: "Durchschnittliche CLVM-Kosten in einem Transaktionsblock.",
    technical:
      "Nicht im Diagrammmaßstab erfasst: Die genauen Kosten erfordern einen vollständigen get_block-Abruf pro Block, zu aufwendig für einen ganzen Zeitraum ohne serverseitigen Cache. Die genauen Kosten eines Blocks stehen auf seiner eigenen Seite.",
    unavailable:
      "Nicht im Diagrammmaßstab erfasst – erfordert einen vollständigen Abruf pro Block. Die genauen Kosten eines Blocks stehen auf seiner eigenen Seite.",
  },
  txBlocksPerHour: {
    title: "Transaktionsblöcke pro Stunde",
    definition: "Wie viele Blöcke im Fenster Transaktionen enthielten.",
  },
  spendsPerTxBlock: {
    title: "Ausgaben pro Transaktionsblock",
    definition: "Durchschnittliche Anzahl ausgegebener Coins in einem Transaktionsblock.",
    technical:
      "Nicht im Diagrammmaßstab erfasst: Erfordert pro Block einen indexierten oder additions/removals-Abruf, zu aufwendig für einen ganzen Zeitraum ohne serverseitigen Cache. Die Ausgaben eines Blocks stehen auf seiner eigenen Seite.",
    unavailable:
      "Nicht im Diagrammmaßstab erfasst – erfordert einen Abruf pro Block. Die Ausgaben eines Blocks stehen auf seiner eigenen Seite.",
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
    definition: "Das aktuelle Proof-of-Space-Schwierigkeitsziel des Nodes.",
    technical:
      "Kein geprüfter Weg, die historische Schwierigkeit aus get_block_records zu gewinnen; get_blockchain_state meldet nur den aktuellen Wert.",
    unavailable:
      "Aus den verfügbaren Endpunkten nicht ohne ungeprüfte Berechnungen ableitbar – eine falsche Zahl wäre schlimmer als keine. get_blockchain_state zeigt den aktuellen Wert in den Einstellungen.",
  },
  blocksPerHour: {
    title: "Blöcke pro Stunde",
    definition: "Alle Blöcke (mit und ohne Transaktionen) pro Stunde.",
  },
  unspentCoins: {
    title: "Nicht ausgegebene Coins",
    definition: "Gesamtzahl der noch nicht ausgegebenen Coins.",
  },
  activePuzzleHashes: {
    title: "Aktive Puzzle-Hashes",
    definition: "Unterschiedliche Puzzle-Hashes, die Coins halten.",
  },
  coinAge: {
    title: "Coin-Alter",
    definition: "Durchschnittliches Alter nicht ausgegebener Coins.",
  },
};

export default messages;
