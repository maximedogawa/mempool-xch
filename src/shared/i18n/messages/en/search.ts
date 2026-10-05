/** Global search box and its input parsing and resolving (src/features/search). */
import { defineNamespace } from "../../translate";

const messages = {
  label: "Search transactions, blocks, addresses, coins and assets",
  placeholderLarge: "Search tx, block, address, coin, CAT or NFT…",
  placeholder: "Search tx id, block, address, coin, CAT or NFT…",
  clear: "Clear search",
  submit: "Search",
  go: "Go",
  severalMatches: "Several matches, pick one",
  bestGuess: "Best guess",
  noMatches:
    'No matches for "{query}". Try an exact block height, tx id, address, coin id, an nft1 id, a CAT asset id or an @handle.',
  invalid: {
    empty: "Type something to search for.",
    addressChecksum: "That looks like an address but its checksum is wrong.",
    nftChecksum: "That looks like an NFT id but its checksum is wrong.",
    offerFile:
      "That is an offer file, not an id. Its id only exists once the offer is published: upload it on Dexie, then search the offer id shown there or the address that made it.",
    didChecksum: "That looks like a DID but its checksum is wrong.",
    hexLength: "Hex ids must be 32 bytes (64 hex characters).",
  },
  match: {
    transaction: "Transaction",
    coin: "Coin",
    block: "Block {height}",
    offer: "Offer ({status})",
    nft: "NFT",
    did: "DID",
    collection: "Collection",
    cat: "CAT asset",
    address: "Address (puzzle hash)",
    expiredHandle: "{handle} (expired handle)",
  },
};

export default defineNamespace("search", messages);
