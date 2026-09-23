import type { Translation } from "../../translate";
import type en from "../en/pools";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Pools",
  group: {
    selfPooled: "Farmer im Self-Pooling",
    unnamed: "Unbenannter Pool",
    unknown: "Unbekannt",
    everyoneElse: "alle anderen",
  },
  bar: {
    label: "Anteil an den letzten {count} Blöcken: {summary}",
  },
  stats: {
    blocks: "Blöcke",
    heights: "Höhen {start} – {end}",
    largest: "Größter",
    largestHint: "Die größte einzelne Gruppe im Zeitfenster.",
    named: "Benannte Pools",
    namedSub: "{blocks} Blöcke · {pools} Pools",
    namedHint:
      "Anteil der Pools aus dem Verzeichnis, jeweils bestätigt über den eigenen pool_info-Endpunkt des Pools oder eine andere belegte Quelle.",
    payouts: "Auszahlungsadressen",
    payoutsSub: "in {count} Gruppen",
    payoutsHint:
      "Unterschiedliche Pool-Auszahlungsadressen, die im Zeitfenster einen Block gewonnen haben. Jeder PlotNFT-Farmer hat seine eigene, daher gehören einem Pool viele.",
  },
  share: {
    title: "Anteil nach Pool",
    search: "Pool oder Adresse suchen",
    loadError: "Pool-Anteile konnten nicht geladen werden",
    noClaims:
      "Belohnungs-Claims stammen aus der indexierten API von Coinset, die ein eigener Node nicht bietet: PlotNFT-Farmer werden hier einzeln statt unter ihrem Pool aufgeführt.",
    resolving: {
      one: "Es wird geprüft, wer die Belohnungen von {count} Auszahlungsadresse einfordert; Pools wachsen, sobald Ergebnisse eintreffen. Ihr Browser merkt sie sich für den nächsten Besuch.",
      other:
        "Es wird geprüft, wer die Belohnungen von {count} Auszahlungsadressen einfordert; Pools wachsen, sobald Ergebnisse eintreffen. Ihr Browser merkt sie sich für den nächsten Besuch.",
    },
    noMatch: "Kein Pool und keine Adresse passen zu „{search}“.",
    colPool: "Pool",
    colPayouts: "Auszahlungsadressen",
    colBlocks: "Blöcke",
    colShare: "Anteil",
    showTop: "Nur die Top {count} anzeigen",
    showAll: "Alle {count} Zeilen anzeigen",
  },
  row: {
    bothShares: "beide Anteile",
    bothSharesHint:
      "Pool-Belohnung (7/8) und Farmer-Belohnung (1/8) gehen bei jedem Block an dieselbe Adresse, es ist also kein PlotNFT des offiziellen Pool-Protokolls: ein Solo-Farmer oder ein Betreiber mit eigenem Protokoll.",
    claimsTo: "Claim an <hash></hash>",
    showFewer: "Weniger anzeigen",
    more: "+{count} weitere",
  },
  footnote:
    "Die Auszahlungsadresse eines Blocks und der Claim, der sie leert, liegen beide on-chain, daher ist die Gruppierung exakt; nur die Namen stammen aus einem Verzeichnis, abgeglichen mit der Zieladresse, die ein Pool an seinem <code>pool_info</code>-Endpunkt veröffentlicht. Eine Adresse, deren Belohnungen nie eingefordert wurden (ein neues PlotNFT oder ein Pool, der noch nicht eingesammelt hat), bleibt „Unbekannt“, bis das geschieht. Sie kennen einen fehlenden Pool? Ergänzen Sie einen belegten Eintrag in <code>src/shared/lib/pools/registry.json</code> (siehe den Beitragshinweis im Wiki).",
};

export default messages;
