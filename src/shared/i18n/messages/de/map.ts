import type { Translation } from "../../translate";
import type en from "../en/map";

const messages: Translation<typeof en> = {
  title: "Netzwerkkarte",
  titleHint:
    "Alle Zahlen auf dieser Seite stammen aus dem veröffentlichten Snapshot des Chia-Peer-Info-Dashboards. Länder-Marker zeigen aggregierte Node-Bestände an repräsentativen Punkten; es braucht weder einen Crawler im Browser noch das Sammeln von Adressen.",
  intro:
    "Wo die Full Nodes von Chia stehen, welche Version sie ausführen und was im Netzwerk gerade passiert. Suchen Sie oder wählen Sie eine Region, um die Karte einzugrenzen, und klicken Sie dann auf ein Land für Details.",
  stats: {
    fullNodes: "Full Nodes",
    fullNodesSub: "in den letzten 5 Tagen gesehen",
    mainnetOnly: "nur Mainnet",
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
    noSnapshot: "Kein Dashboard-Snapshot für dieses Netzwerk.",
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
    showsMainnet:
      "<b>Was sie zeigt.</b> Full-Node-Bestände pro Land aus dem Chia-Peer-Info-Dashboard, erfasst für das Mainnet, dazu die verbundenen Peers eines konfigurierten Nodes. Die Markergröße entspricht der Node-Anzahl, die Farbe der Region.",
    notShows:
      "<b>Was sie nicht ist.</b> Chia veröffentlicht weder Node-Koordinaten noch, wo ein Block gefarmt wurde oder woher ein Spend Bundle kam. Marker sitzen an einem repräsentativen Punkt pro Land, und die Reichweitenbögen und Impulse sind ein Modell der Ausbreitung, keine Paketroute.",
  },
  source:
    "Quelle: <link>Chia-Peer-Info-Dashboard</link>, erfasst {observed} UTC. Das Länder-Panel erfasst {placed} der {total} Nodes, die das Bestands-Panel meldet. An einen Geolokalisierungsdienst werden nur Node-Adressen gesendet, niemals die des Besuchers.",
  sourceGap:
    "Quelle: <link>Chia-Peer-Info-Dashboard</link>, erfasst {observed} UTC. Das Länder-Panel erfasst {placed} der {total} Nodes, die das Bestands-Panel meldet; die Lücke von {gap} Nodes entsteht zwischen zwei getrennten Dashboard-Abfragen und ist kein Rundungsfehler. An einen Geolokalisierungsdienst werden nur Node-Adressen gesendet, niemals die des Besuchers.",
  ownNodeHint:
    "Richten Sie die Einstellungen auf Ihren eigenen Node aus, um hier auch dessen verbundene Peers zu sehen.",
  detail: {
    nodes: "Nodes",
    share: "Anteil",
    rank: "Rang",
    region: "Region",
    yourPeers: "Ihre Peers",
    note: "Dashboard-Schätzung an einem repräsentativen Punkt, kein lokalisierter Node.",
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
