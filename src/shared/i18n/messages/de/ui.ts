import type { Translation } from "../../translate";
import type en from "../en/ui";

const messages: Translation<typeof en> = {
  copy: "Kopieren",
  copyToClipboard: "{label} in die Zwischenablage",
  yours: "Ihre",
  capacity: {
    label: "Mempool-Auslastung",
    costOf: "{used} von {max} Kosten",
    blocks: "{percent} · {filled}/{segments} Blöcke",
    valueText: "{used} von {max} Kosten, {percent}",
  },
  kind: {
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    did: "DID",
    offer: "Offer",
    pool: "Pool",
    singleton: "Singleton",
    unknown: "Unbekannt",
  },
  summaryKind: {
    transfer: "Überweisung",
    swap: "Tausch",
    mint: "Mint",
    melt: "Melt",
    combine: "Zusammenführen",
    split: "Aufteilen",
    pool: "Pool",
    revoke: "Widerruf",
    clawback: "Clawback",
    unknown: "Unbekannt",
  },
  status: {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    removed: "Verworfen",
    unknown: "Unbekannt",
  },
  image: {
    noImage: "{alt} (kein Bild)",
    reason: "Grund: ",
    video: "Video",
    showAnyway: "Trotzdem anzeigen",
    clickToShow: "{summary} – zum Anzeigen klicken",
    veiled: "{alt}: {summary}",
    veiledButton: "{alt}: {summary}. Trotzdem anzeigen.",
  },
  cat: {
    unknown: "Unbekannter CAT · 0x{id}",
  },
  chart: {
    notEnough: "Noch nicht genug Daten.",
    collecting: "Stichproben werden gesammelt … der Verlauf beginnt, sobald die App geöffnet ist.",
    lineSummary: {
      one: "{label}. {count} Punkt von {from} bis {to}. Zuletzt {latest}.",
      other: "{label}. {count} Punkte von {from} bis {to}. Zuletzt {latest}.",
    },
    stackedSummary: {
      one: "{label}. {count} Stichprobe von {from} bis {to}. Zuletzt insgesamt {latest}.",
      other: "{label}. {count} Stichproben von {from} bis {to}. Zuletzt insgesamt {latest}.",
    },
    total: "Gesamt {value}",
  },
};

export default messages;
