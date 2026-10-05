import type { Translation } from "../../translate";
import type en from "../en/search";

const messages: Translation<(typeof en)["messages"]> = {
  label: "Transaktionen, Blöcke, Adressen, Coins und Assets durchsuchen",
  placeholderLarge: "Tx, Block, Adresse, Coin, CAT oder NFT suchen…",
  placeholder: "Tx-ID, Block, Adresse, Coin, CAT oder NFT suchen…",
  clear: "Suche leeren",
  submit: "Suchen",
  go: "Los",
  severalMatches: "Mehrere Treffer, bitte wählen",
  bestGuess: "Bester Treffer",
  noMatches:
    "Keine Treffer für „{query}“. Versuchen Sie eine genaue Blockhöhe, Tx-ID, Adresse, Coin-ID, eine nft1-ID, eine CAT-Asset-ID oder einen @handle.",
  invalid: {
    empty: "Geben Sie einen Suchbegriff ein.",
    addressChecksum: "Das sieht nach einer Adresse aus, aber die Prüfsumme stimmt nicht.",
    nftChecksum: "Das sieht nach einer NFT-ID aus, aber die Prüfsumme stimmt nicht.",
    offerFile:
      "Das ist eine Offer-Datei, keine ID. Ihre ID gibt es erst, wenn das Offer veröffentlicht ist: Laden Sie es auf Dexie hoch und suchen Sie dann nach der dort angezeigten Offer-ID oder nach der Adresse, die es erstellt hat.",
    didChecksum: "Das sieht nach einer DID aus, aber die Prüfsumme stimmt nicht.",
    hexLength: "Hex-IDs müssen 32 Bytes lang sein (64 Hex-Zeichen).",
  },
  match: {
    transaction: "Transaktion",
    coin: "Coin",
    block: "Block {height}",
    offer: "Offer ({status})",
    nft: "NFT",
    did: "DID",
    collection: "Kollektion",
    cat: "CAT-Asset",
    address: "Adresse (Puzzle-Hash)",
    expiredHandle: "{handle} (abgelaufener Handle)",
  },
};

export default messages;
