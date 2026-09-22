import type { Translation } from "../../translate";
import type en from "../en/coin";

const messages: Translation<typeof en> = {
  heading: "Coin",
  spent: "Ausgegeben",
  unspent: "Nicht ausgegeben",
  retry: "Erneut versuchen",
  noId: {
    title: "Keine Coin-ID",
    description:
      "Öffnen Sie einen Coin aus einer Transaktion oder fügen Sie eine Coin-ID in das Suchfeld ein.",
  },
  notFound: {
    title: "Coin nicht gefunden",
    description:
      "In diesem Netzwerk gibt es keinen Coin mit dieser ID. Coins aus einem ausstehenden Spend Bundle erscheinen erst, wenn das Bundle bestätigt ist.",
  },
  loadError: "Der Coin konnte nicht geladen werden",
  stats: {
    amount: "Betrag",
    created: "Erstellt",
    spent: "Ausgegeben",
    blockHeight: "Blockhöhe",
    spendPending: "Ausgabe im Mempool ausstehend",
    noPendingSpend: "keine ausstehende Ausgabe",
    origin: "Herkunft",
    reward: "Belohnung",
    spend: "Ausgabe",
    rewardSub: "Coinbase (Farmer- oder Pool-Belohnung)",
    spendSub: "von einem Spend Bundle erstellt",
  },
  record: {
    title: "Coin-Datensatz",
    coinId: "Coin-ID",
    parentCoin: "Eltern-Coin",
    noParent: "(Belohnung: kein Eltern-Coin)",
    puzzleHash: "Puzzle-Hash",
    address: "Adresse",
    owner: "Besitzer (inneres Puzzle): <address></address>",
    creatingTx: "Erstellende Transaktion",
    spendingTx: "Ausgebende Transaktion",
    rewardCoin: "keine (Belohnungs-Coin)",
    notAvailable: "derzeit nicht von Coinset verfügbar",
    needsCoinset: "erfordert Coinset",
    block: "Block {height}",
    unspent: "nicht ausgegeben",
  },
  type: {
    title: "Typ und Asset",
    needsCoinset:
      "Die Coin-Klassifizierung (XCH, CAT, NFT, DID) erfordert einen Coinset-Endpunkt; der aktuelle eigene Node liefert nur den Rohdatensatz.",
    kind: "Art",
    custodyPuzzle: "Custody-Puzzle",
    catAssetId: "CAT-Asset-ID",
    nft: "NFT",
    launcherId: "Launcher-ID",
    notClassified:
      "Coinset hat diesen Coin nicht klassifiziert (der Coin-Details-Endpunkt ist nicht verfügbar oder der Coin ist noch nicht indexiert). Einfache XCH-Coins brauchen meist keine Klassifizierung.",
  },
  pending: {
    title: "Ausstehende Ausgaben im Mempool",
    none: "Kein Spend Bundle im Mempool gibt diesen Coin aus.",
    spendBundle: "Spend Bundle",
    fee: "Gebühr",
    cost: "Kosten",
    feePerCost: "Gebühr / Kosten",
  },
  children: {
    title: "Kind-Coins",
    titleCount: "Kind-Coins ({count})",
    noneSpent: "Für diesen Coin wurden keine Kind-Coins gefunden.",
    noneUnspent: "Nicht ausgegebene Coins haben noch keine Kind-Coins.",
    coinId: "Coin-ID",
    address: "Adresse",
    amount: "Betrag",
    status: "Status",
    spentAt: "ausgegeben bei {height}",
    unspent: "nicht ausgegeben",
  },
};

export default messages;
