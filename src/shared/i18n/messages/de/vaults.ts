import type { Translation } from "../../translate";
import type en from "../en/vaults";

const messages: Translation<typeof en> = {
  exampleLabel: "Buy-XCH-Hot-Wallet von Chia Network",
  actions: {
    initiateRecovery: "Wiederherstellung gestartet",
    finishRecovery: "Wiederherstellung abgeschlossen",
    clawbackRecovery: "Wiederherstellung per Clawback abgebrochen",
  },
  invalid: {
    checksum: "Das sieht nach einer Adresse aus, aber die Prüfsumme stimmt nicht.",
    format:
      "Fügen Sie eine Vault-Launcher-ID (64 Hex-Zeichen) oder die xch-Adresse des Vaults ein.",
  },
  title: "Chia Vaults",
  tooltip:
    "Ein Chia Vault hält das Ausgaberecht getrennt von den Coins: Ein Passkey, ein Hardware-Schlüssel oder m-von-n-Signierer kontrollieren ein Singleton, und ein Wiederherstellungspfad gibt dem Eigentümer nach einer Wartezeit wieder Zugriff, die der Vault per Clawback abbrechen kann. Coinset streamt Wiederherstellungsschritte, hat aber kein Vault-Verzeichnis; der unten verlinkte Scanner indexiert alle Vaults.",
  intro:
    "Suchen Sie einen Vault über seine Launcher-ID oder Adresse, oder durchsuchen Sie alle im <link>Community-Vault-Scanner</link>.",
  lookup: {
    title: "Vault-Suche",
    placeholder: "Vault-Launcher-ID oder xch-Adresse",
    inputLabel: "Vault-Launcher-ID oder Adresse",
    submit: "Suchen",
    example: "Beispiel ausprobieren",
    needsCoinset:
      "Für das Singleton des Vaults wird Coinset benötigt; seine Mittel werden von Ihrem Node an der aus der Launcher-ID abgeleiteten Adresse gelesen.",
    vaultAddress: "Vault-Adresse <hash></hash>",
    noSingleton: "Coinset kennt kein Singleton mit dieser Launcher-ID.",
    singleton: "Singleton",
    singletonFallback: "Singleton",
    coinSpent: "aktueller Coin ausgegeben",
    coinUnspent: "aktueller Coin nicht ausgegeben",
    coinSince: "Aktueller Coin seit",
    coinAmount: "Coin-Betrag",
    coinAmountSub: "das Singleton selbst, nicht die Mittel des Vaults",
    funds: "Mittel",
    fundsError: "Die Coins des Vaults konnten nicht geladen werden",
    unspentCoins: {
      one: "{count} nicht ausgegebener Coin",
      other: "{count} nicht ausgegebene Coins",
    },
    fundsHint:
      "Die Mittel eines Vaults liegen an einem Puzzle-Hash, der aus seiner Launcher-ID abgeleitet wird (dem p2-Singleton-Puzzle des Vaults), hier im Browser berechnet. Das ist das Guthaben der Hauptadresse des Vaults; Coins, die der Vault an andere Adressen bewegt hat, sind nicht enthalten.",
    launcher:
      "Launcher <launcher></launcher> · Mittel bei <funds></funds> · aktueller Coin bei <current></current> · <scanner>im Scanner öffnen</scanner>",
    fullHistory: "<hash></hash> · vollständiger Verlauf auf der Adressseite.",
  },
  funds: {
    balance: "Guthaben",
    balanceSub: "nicht ausgegebene Coins an dieser Adresse",
    coins: "Coins",
    newestCoin: "Neuester Coin",
  },
  activity: {
    title: "Wiederherstellungsaktivität",
    fromStream: "aus dem Vault-Stream von Coinset",
    needsStream: "benötigt den Coinset-Stream",
    empty:
      "Auf dieser Verbindung wurde noch keine Vault-Wiederherstellung gesehen. Wiederherstellungen sind selten; sobald eine eintrifft, bleibt sie hier auch über Besuche hinweg aufgelistet.",
  },
};

export default messages;
