import type { Translation } from "../../translate";
import type en from "../en/map";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Netzwerkkarte",
  titleHint:
    "Die Zahlen stammen aus einem Snapshot des öffentlichen Chia-Peer-Info-Dashboards. Länder-Marker zeigen aggregierte Node-Bestände an repräsentativen Punkten. Fehlt der Snapshot oder ist er älter als 30 Tage, fragt die Seite stattdessen von Ihrem Browser aus die DNS-Introducer von Chia ab.",
  intro:
    "Wo die Full Nodes von Chia stehen, welche Version sie ausführen und was im Netzwerk gerade passiert. Suchen Sie oder wählen Sie eine Region, um die Karte einzugrenzen, und klicken Sie dann auf ein Land für Details.",
  stats: {
    fullNodes: "Full Nodes",
    fullNodesSub: "in den letzten 5 Tagen gesehen",
    fullNodesHint:
      "Vom Chia-Peer-Info-Dashboard gemeldeter Full-Node-Bestand über ein Fenster von fünf Tagen.",
    reliable: "Zuverlässig",
    reliableSub: "{share} des Netzwerks",
    reliableHint:
      "Nodes, die stabil genug sind, dass der Crawler sie über die DNS-Introducer weitergibt.",
    ipv6: "IPv6",
    ipv6Sub: { one: "{count} Node", other: "{count} Nodes" },
    ipv6Hint:
      "Anteil des Bestands, den der Crawler über IPv6 erreicht hat. Ein Node kann auf beiden antworten.",
    countries: "Länder",
    countriesSub: { one: "{count} Node zugeordnet", other: "{count} Nodes zugeordnet" },
    countriesHint:
      "Vom Crawler gemeldete Länder, jedes mit einem repräsentativen Punkt auf der Karte.",
    concentration: "Konzentration",
    concentrationValue: { one: "{count} Land", other: "{count} Länder" },
    concentrationSub: "{country} hält {share}",
    concentrationHint: "Wie viele der größten Länder zusammen die Hälfte aller Full Nodes halten.",
    snapshot: "Snapshot",
    snapshotSub: "zuletzt erfasst",
    unavailable: "nicht verfügbar",
    snapshotHint: "Alter der Dashboard-Erfassung, auf der diese Seite beruht.",
  },
  mapCard: {
    title: "Chia Full Nodes – live",
    modelledReach: "Modellierte Reichweite",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    resetView: "Kartenansicht zurücksetzen",
    reset: "zurücksetzen",
    searchLabel: "Karte nach Land oder Region filtern",
    searchPlaceholder: "Karte filtern – Land, Code oder Region",
    suggestionNodes: { one: "{count} Node", other: "{count} Nodes" },
    filteredSummary: "{shown} von {total} Ländern · {nodes} Nodes ({share})",
    summary: "{nodes} Full Nodes · {countries} Länder",
    controls: "ziehen zum Verschieben · Doppelklick oder ⌘/Strg + Mausrad zum Zoomen · {scale}×",
    noMatch: "Kein Land passt zu „{query}“.",
    modelLegend:
      "Länder, die seit dem letzten Snapshot oder der letzten Scan-Antwort neu sind oder sich geändert haben, wachsen ein oder senden einen Ring aus. Die Impulse (gelb: neue Spitze, grün: Mempool-Batch) und die Reichweitenbögen sind ein Modell: Sie landen gewichtet nach Node-Anzahl in Ländern, nicht dort, wo ein Block oder Spend Bundle herkam.",
  },
  fallback: {
    missing: "Der Dashboard-Snapshot fehlt oder ist nicht lesbar.",
    stale:
      "Der Dashboard-Snapshot stammt vom {date}, liegt also mehr als {days} Tage zurück und zeigt das Netzwerk nicht mehr, wie es ist.",
    network: "Der Dashboard-Snapshot deckt nur das Mainnet ab, nicht {network}.",
    scan: "Diese Karte zeigt stattdessen den laufenden Seeder-Scan: die Nodes, die Ihr Browser über die DNS-Introducer von Chia findet, verortet von GeoJS. Er sieht einige hundert Nodes, nicht das ganze Netzwerk.",
  },
  scan: {
    found: "Gefundene Nodes",
    foundSub: {
      one: "aus {count} Seeder-Antwort",
      other: "aus {count} Seeder-Antworten",
    },
    foundHint:
      "Full-Node-Adressen, die die DNS-Introducer diesem Browser genannt haben, eine Woche lang im lokalen Speicher aufbewahrt.",
    located: "Verortet",
    locatedSub: {
      one: "{count} wartet auf einen Standort",
      other: "{count} warten auf einen Standort",
    },
    locatedHint:
      "Gefundene Nodes, die GeoJS verorten konnte. Die Anteile auf dieser Seite beziehen sich auf diese Nodes.",
    countriesHint:
      "Länder, in denen die verorteten Nodes stehen, jedes an einem repräsentativen Punkt.",
    lastAnswer: "Letzte Antwort",
    lastAnswerHint: "Solange die Seite sichtbar ist, wird alle 6 Sekunden ein Introducer gefragt.",
    scanning: "scannt",
    pausedHidden: "pausiert, solange der Tab verborgen ist",
    snapshotSub: "stattdessen Seeder-Scan",
    logTitle: "Seeder-Scan",
    logAction: "ein Introducer alle {seconds} s",
    logWaiting: "Der erste Introducer wird gefragt…",
    logEntry: "{answered} geantwortet · {added} neu",
    logError: "keine Antwort",
    source:
      "Quelle: der Seeder-Scan dieses Browsers (DNS-Introducer von Chia über Cloudflare DNS, mit dns.google als Ausweichlösung; Standorte von GeoJS). An einen Geolokalisierungsdienst werden nur Node-Adressen gesendet, niemals die des Besuchers.",
  },
  worldMap: {
    label: "Weltkarte mit {nodes} beobachteten Chia-Nodes in {countries} Ländern",
    marker: {
      one: "{country}: {count} Node, Rang {rank}",
      other: "{country}: {count} Nodes, Rang {rank}",
    },
    peer: "Verbundener Peer {host} in der Nähe von {place}",
  },
  activity: {
    title: "Live-Aktivität aus Sicht dieses Nodes",
    counts: "{blocks} Blöcke · {bundles} Bundles",
    waiting: "Warten auf das erste Ereignis…",
    newPeak: "Neue Spitze <link>#{height}</link>",
  },
  versions: {
    title: "Node-Versionen",
    reporting: {
      one: "{count} Node meldet eine Version",
      other: "{count} Nodes melden eine Version",
    },
    empty: "Der Snapshot enthält kein Versions-Panel.",
    note: "Die Anteile beziehen sich auf die {reporting} Nodes, deren Version der Crawler kennt ({coverage} des Bestands).",
    noteNewest:
      "Die Anteile beziehen sich auf die {reporting} Nodes, deren Version der Crawler kennt ({coverage} des Bestands); {newest} ist der neueste gemeldete Build.",
  },
  regions: {
    title: "Regionen",
    action: "klicken, um die Karte zu filtern",
    names: {
      europe: "Europa",
      asia: "Asien",
      northAmerica: "Nordamerika",
      southAmerica: "Südamerika",
      africa: "Afrika",
      oceania: "Ozeanien",
      unmapped: "Nicht zugeordnet",
    },
  },
  reach: {
    title: "Erreichbarkeit",
    action: "Crawler-Fenster von fünf Tagen",
    ipv4: "IPv4",
    ipv6: "IPv6",
    reliable: "Zuverlässig",
    ipv4Hint: "Nodes, die der Crawler in den letzten fünf Tagen über IPv4 erreicht hat.",
    ipv6Hint: "Nodes, die der Crawler in den letzten fünf Tagen über IPv6 erreicht hat.",
    reliableHint:
      "Nodes, die stabil genug sind, dass der Crawler sie über die DNS-Introducer weitergibt.",
    overlap:
      "Die Anteile von IPv4 und IPv6 überschneiden sich: Ein Dual-Stack-Node zählt in beiden, daher ergeben sie zusammen mehr als der Bestand.",
  },
  countries: {
    title: "Länder",
    titleFiltered: "Länder – gefiltert",
    action: "{nodes} Nodes in {countries} Ländern",
    scanWaiting: "Noch kein Node verortet; der Seeder-Scan läuft noch.",
    noMatch: "Kein Land passt zum aktuellen Filter.",
    tableLabel: "Länder",
    country: "Land",
    region: "Region",
    nodes: "Nodes",
    share: "Anteil",
    showTop: "Nur die Top {count} anzeigen",
    showAll: "Alle {count} Länder anzeigen",
  },
  about: {
    title: "Was diese Karte ist",
    shows:
      "<b>Was sie zeigt.</b> Full-Node-Bestände pro Land aus dem Chia-Peer-Info-Dashboard, erfasst {age}, dazu die verbundenen Peers eines konfigurierten Nodes. Die Markergröße entspricht der Node-Anzahl, die Farbe der Region.",
    showsScan:
      "<b>Was sie zeigt.</b> Die Full Nodes, die Ihr Browser über die DNS-Introducer von Chia gefunden hat, gruppiert nach dem Land, in dem GeoJS sie verortet, dazu die verbundenen Peers eines konfigurierten Nodes. Die Markergröße entspricht der Node-Anzahl, die Farbe der Region.",
    notShows:
      "<b>Was sie nicht ist.</b> Chia veröffentlicht weder Node-Koordinaten noch, wo ein Block gefarmt wurde oder woher ein Spend Bundle kam. Marker sitzen an einem repräsentativen Punkt pro Land, und die Reichweitenbögen und Impulse sind ein Modell der Ausbreitung, keine Paketroute.",
  },
  source:
    "Quelle: <link>Chia-Peer-Info-Dashboard</link>, erfasst {observed} UTC. Das Länder-Panel erfasst {placed} der {total} Nodes, die das Bestands-Panel meldet. An einen Geolokalisierungsdienst werden nur Node-Adressen gesendet, niemals die des Besuchers.",
  sourceGap:
    "Quelle: <link>Chia-Peer-Info-Dashboard</link>, erfasst {observed} UTC. Das Länder-Panel erfasst {placed} der {total} Nodes, die das Bestands-Panel meldet; die Lücke von {gap} Nodes entsteht zwischen zwei getrennten Dashboard-Abfragen und ist kein Rundungsfehler. An einen Geolokalisierungsdienst werden nur Node-Adressen gesendet, niemals die des Besuchers.",
  attribution:
    "Node-Statistiken von Chia Network Inc. aus dessen öffentlichem <link>Peer-Info-Dashboard</link>, von Hand als statischer Snapshot übernommen.",
  history: {
    title: "Netzwerk im Zeitverlauf",
    action: "alle 3 Tage · letzte zwei Jahre",
    seriesLabel: "Reihe",
    total: "Full Nodes",
    capacity: "Zuverlässig",
    ipv4: "IPv4",
    ipv6: "IPv6",
    chartLabel: "{series} im Zeitverlauf",
    note: "Die Crawler-Reihen des Peer-Info-Dashboards, ein Wert alle drei Tage, bis zum Snapshot.",
    versionsTitle: "Versionen im Zeitverlauf",
    versionsAction: "alle 3 Tage · letztes Jahr",
    versionsLabel: "Nodes nach Version im Zeitverlauf",
    versionsLegend: "Versionen",
    otherVersions: "andere",
  },
  asns: {
    title: "Netzbetreiber",
    action: {
      one: "{count} autonomes System",
      other: "{count} autonome Systeme",
    },
    tableLabel: "Netzbetreiber",
    organization: "Betreiber",
    asn: "ASN",
    nodes: "Nodes",
    share: "Anteil",
    note: "Die {shown} größten von {count} Betreibern (autonomen Systemen), die der Crawler gefunden hat; zusammen hosten sie {share} der Nodes, die er einem Betreiber zuordnen konnte.",
  },
  ownNodeHint:
    "Richten Sie die Einstellungen auf Ihren eigenen Node aus, um hier auch dessen verbundene Peers zu sehen.",
  detail: {
    nodes: "Nodes",
    share: "Anteil",
    rank: "Rang",
    region: "Region",
    yourPeers: "Ihre Peers",
    lastSeen: "Zuletzt gesehen",
    note: "Dashboard-Schätzung an einem repräsentativen Punkt, kein lokalisierter Node.",
    noteScan:
      "Anteil an den Nodes, die dieser Browser verortet hat, an einem repräsentativen Punkt gezeichnet.",
  },
  peers: {
    errorTitle: "Verbindungen konnten nicht gelesen werden",
    errorDescription: "Ihr Node hat auf get_connections nicht geantwortet.",
    none: "Keine Peer-Verbindungen gemeldet.",
    title: "Verbindungen Ihres Nodes",
    action: {
      one: "{count} Peer · aktualisiert alle 15 s",
      other: "{count} Peers · aktualisiert alle 15 s",
    },
    tableLabel: "Verbindungen",
    peer: "Peer",
    type: "Typ",
    location: "Standort",
    network: "Netzwerk",
    peakHeight: "Peak-Höhe",
    sentReceived: "Gesendet / empfangen",
    connected: "Verbunden",
    unknownType: "Typ {type}",
    types: {
      fullNode: "Full Node",
      harvester: "Harvester",
      farmer: "Farmer",
      timelord: "Timelord",
      introducer: "Introducer",
      wallet: "Wallet",
    },
  },
};

export default messages;
