import type { Translation } from "../../translate";
import type en from "../en/wallet";

const messages: Translation<(typeof en)["messages"]> = {
  sageBadge: "aus Ihrer Sage-Wallet",
  enableInSage: "In Sage aktivieren",
  direction: {
    sent: "Gesendet",
    received: "Empfangen",
    transaction: "Transaktion",
  },
  stats: {
    balance: "Guthaben",
    pending: "Ausstehend",
    inFlight: "Transaktionen unterwegs",
    coins: "Coins",
    unspentInWallet: "nicht ausgegeben in der Wallet",
    sync: "Sync",
    syncedCoins: "{synced} von {total} Coins",
    history: "Verlauf",
    historySub: "Transaktionen · {coins} Coins",
  },
  addressPanel: {
    title: "Ihre Wallet",
    open: "Meine Wallet öffnen →",
  },
  coinPanel: {
    title: "Ihr Coin",
    amount: "Betrag",
    address: "Adresse",
    created: "Erstellt",
    spent: "Ausgegeben",
    pending: "ausstehend",
    unspent: "nicht ausgegeben",
    blockHeight: "Blockhöhe",
    stillInWallet: "noch in der Wallet",
  },
  priceChip: {
    title: "XCH-Preis aus Ihrer Sage-Wallet, {age}",
  },
  txRow: {
    pending: "Ausstehend · {kind}",
    block: "Block {height}",
    inMempool: "im Mempool",
  },
  loadMore: {
    transactions: "{loaded} von {total} Transaktionen",
    coins: "{loaded} von {total} Coins",
    loading: "Wird geladen…",
    more: "Mehr laden",
  },
  enable: {
    assetBalances: "Der Sage-Zugriff auf Asset-Guthaben ist deaktiviert.",
    balanceAddress: "Der Sage-Zugriff auf Ihr Guthaben und Ihre Adresse ist deaktiviert.",
    history: "Der Sage-Zugriff auf Ihren Transaktionsverlauf ist deaktiviert.",
    coins: "Der Sage-Zugriff auf Ihre Coins ist deaktiviert.",
  },
  tabs: {
    label: "Wallet-Bereiche",
    assets: "Assets",
    transactions: "Transaktionen",
    coins: "Coins",
  },
  asset: {
    owned: "{count} im Besitz",
    txCount: "{count} Tx",
    coins: { one: "{count} Coin", other: "{count} Coins" },
  },
  assets: {
    title: "Assets · {count}",
    partial:
      "gefunden in den ersten {loaded} von {total} Transaktionen · unter „Transaktionen“ weiterscrollen, um mehr zu finden",
  },
  page: {
    outsideTitle: "Öffnen Sie mempoolxch.space in der Sage-Wallet",
    outsideDescription:
      "Diese Seite liest Guthaben, ausstehende Transaktionen, Assets und Coins direkt aus Ihrer Wallet. Im Browser suchen Sie stattdessen nach Ihrer Adresse.",
    backToDashboard: "Zurück zur Übersicht",
    title: "Meine Wallet",
    fromSage: "aus Sage",
    intro:
      "Guthaben, Assets, Transaktionen und Coins stammen aus Ihrer Sage-Wallet; Mempool, Blöcke und andere Adressen kommen weiterhin von {network} über den konfigurierten Node.",
    openAddress: "<link>Diese Adresse im Explorer öffnen</link>.",
    noAnswerTitle: "Sage hat nicht geantwortet",
    noAnswerDescription:
      "Die Wallet-Bridge war nicht erreichbar. Öffnen Sie die App erneut aus der App-Liste von Sage.",
    receiveAddress: "Empfangsadresse",
    pendingTitle: "Ausstehend · {count}",
    transactions: "Transaktionen",
    newestFirst: "neueste zuerst",
    noTransactions: "Noch keine Transaktionen.",
    coins: "Coins",
    unspentNewestFirst: "nicht ausgegeben, neueste zuerst",
    noCoins: "Keine Coins vorhanden.",
    colCoin: "Coin",
    colAddress: "Adresse",
    colAmount: "Betrag",
    colCreated: "Erstellt",
  },
  pending: {
    title: "Ihre Transaktionen unterwegs",
    titleCount: "Ihre Transaktionen unterwegs · {count}",
    confirmedIn: "Bestätigt in Block <link>{height}</link>",
    confirmed: "Bestätigt",
    submitted: "gesendet {age}",
    mute: "Bestätigungston stummschalten",
    unmute: "Einen Ton abspielen, wenn eine Transaktion bestätigt wird",
    chimeOn: "Ton bei Bestätigung einer Transaktion an",
    chimeOff: "Ton aus",
    walletLink: "Wallet",
    allowNotice:
      "Erlauben Sie Sage, ausstehende Transaktionen zu teilen, um sie hier zu verfolgen.",
    reading: "Wallet wird gelesen…",
    empty:
      "Nichts unterwegs. Neue Überweisungen erscheinen hier mit ihrem Platz in der Warteschlange.",
  },
};

export default messages;
