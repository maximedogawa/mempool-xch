import type { Translation } from "../../translate";
import type en from "../en/api";

const messages: Translation<typeof en> = {
  title: "API-Referenz",
  titleHint:
    "mempoolxch.space hat keine eigene Server-API: Jede Seite, die Sie sehen, liest einen Chain-Endpunkt direkt aus Ihrem Browser, genau wie diese App. Diese Seite dokumentiert die Aufrufe, die die App selbst macht, damit Sie sie ebenfalls nutzen können – gegen den öffentlichen Endpunkt von Coinset oder Ihren eigenen Node.",
  coinsetOnly: "nur Coinset",
  anyFullNode: "jeder Full Node",
  showExample: "Beispiel anzeigen",
  hideExample: "Beispiel ausblenden",
  base: {
    title: "Basis-URLs",
    intro:
      "Jede der folgenden Methoden ist ein <code>POST</code> an <code>{base}/{method}</code> mit JSON-Body, ohne Authentifizierung, CORS offen. Der Full-Node-RPC und die indexierte API von Coinset teilen sich denselben Host.",
    mainnet: "Mainnet:",
    testnet: "Testnet11:",
    websocket: "WebSocket (Peak- und Transaktionsereignisse):",
    specs:
      "Vollständige OpenAPI-Spezifikationen: <code>coinset.org/openapi/full_node_bundled.json</code> und <code>coinset.org/openapi/coinset_bundled.json</code>. Mit „jeder Full Node“ markierte Endpunkte funktionieren auch mit Ihrem eigenen Node – siehe <link>Einstellungen → eigener Node</link>.",
  },
  groups: {
    chain: "Chain und Mempool",
    blocks: "Blöcke",
    transactions: "Transaktionen (indexiert, nur Coinset)",
    coins: "Coins",
    balances: "Guthaben und Assets (indexiert, nur Coinset)",
    offers: "Offers, Clawbacks und Reorgs (indexiert, nur Coinset)",
  },
  endpoints: {
    get_blockchain_state:
      "Peak-Höhe und -Hash, Mempool-Größe und -Kosten, maximale Blockkosten, Schwierigkeit, Sync-Status.",
    get_fee_estimate: "Gebühr-pro-Kosten-Schätzung für eine oder mehrere Ziel-Bestätigungszeiten.",
    get_all_mempool_tx_ids: "Alle Spend-Bundle-IDs, die sich gerade im Mempool befinden.",
    get_all_mempool_items:
      "Alle ausstehenden Spend Bundles vollständig. Groß (mehrere Dutzend MB); die App gleicht sie mit den bereits bekannten IDs ab, statt alles neu zu laden.",
    get_mempool_item_by_tx_id: "Ein ausstehendes Spend Bundle nach ID.",
    get_mempool_items_by_coin_name: "Ausstehende Spend Bundles, die einen Coin betreffen.",
    get_network_space: "Geschätzter Netspace zwischen zwei Header-Hashes.",
    get_block_records:
      "Block-Records in einem Höhenbereich, Ende exklusiv. Coinset begrenzt einen einzelnen Aufruf auf 1.000 Records.",
    get_block_record_by_height: "Ein Block-Record nach Höhe.",
    get_block_record: "Ein Block-Record nach Header-Hash.",
    get_block: "Der vollständige Block (Generator-Infos, Belohnungs-Claims) nach Header-Hash.",
    get_block_spends: "Coin-Ausgaben in einem Block (Fallback für eigene Nodes beim Coin-Fluss).",
    get_additions_and_removals:
      "In einem Block erzeugte und entfernte Coins, für die Coin-Fluss-Ansicht.",
    get_block_transactions:
      "Semantische Transaktionszusammenfassungen, die in einem Block bestätigt wurden, paginiert.",
    get_transaction: "Eine semantische Transaktionszusammenfassung nach Spend-Bundle-ID.",
    get_transactions_by_p2:
      "Transaktionsverlauf für den Puzzle-Hash einer Adresse, paginiert, neueste zuerst.",
    get_pending_transactions_by_p2: "Ausstehende Transaktionen für eine Adresse.",
    get_transactions_by_cat_asset_id: "Transaktionsverlauf für eine CAT-Asset-ID, paginiert.",
    get_transactions_by_nft_id: "Transaktionsverlauf für ein NFT.",
    get_transactions_by_coin_name:
      "Die Transaktion, die einen Coin erzeugt und – falls ausgegeben – entfernt hat.",
    get_coin_record_by_name: "Ein Coin-Record nach Coin-ID.",
    get_coin_records_by_names: "Coin-Records für eine Liste von Coin-IDs.",
    get_coin_records_by_puzzle_hash: "Coin-Records, die an einen Puzzle-Hash gezahlt wurden.",
    get_coin_records_by_hint: "Coin-Records nach Memo-Hint (so finden Wallets ihre eigenen Coins).",
    get_coin_records_by_parent_ids:
      "Coin-Records, die von einer Liste von Eltern-Coin-IDs erzeugt wurden.",
    get_puzzle_and_solution: "Reveal und Solution, mit denen ein Coin ausgegeben wurde.",
    get_memos_by_coin_name: "Memo-Strings, die an die Ausgabe eines Coins angehängt sind.",
    get_coin_details: "Coin-Semantik (Art, Asset-ID), sofern Coinset ihn klassifizieren kann.",
    push_tx: "Ein Spend Bundle an den Mempool senden.",
    get_xch_balance_by_p2: "Bestätigtes und ausstehendes XCH-Guthaben für einen Puzzle-Hash.",
    get_cat_balances_by_p2: "CAT-Guthaben für einen Puzzle-Hash.",
    get_nft_balance_by_p2: "Anzahl der NFTs für einen Puzzle-Hash.",
    get_singleton_info: "Abstammung eines Singletons (NFT/DID) nach Launcher-ID.",
    get_latest_nft_coin_by_nft_id: "Der aktuelle, nicht ausgegebene Coin eines NFT.",
    get_offer:
      "Lebenszyklus-Status eines Offers nach ID: beide Seiten, Maker, die annehmende oder stornierende Transaktion.",
    get_offers_by_p2:
      "Offers, die von einem Puzzle-Hash erstellt wurden, ein Lebenszyklus-Status pro Aufruf.",
    get_offers_by_cat_asset_id: "Offers, die einen CAT anbieten oder anfragen.",
    get_offers_by_nft_id: "Offers, die ein NFT anbieten oder anfragen.",
    get_clawback_coins_by_receiver:
      "An einen Puzzle-Hash gesendete Clawback-Coins, mit Timelock und ob der Absender sie noch zurückholen kann.",
    get_reorgs: "Von Coinset erkannte Chain-Reorganisationen, neueste zuerst.",
    get_raw_transaction_by_id:
      "Mempool-artiger Eintrag (Coin-Ausgaben, Additions, Removals) eines Bundles, auch nachdem es den Mempool verlassen hat.",
  },
  otherData: {
    title: "Weitere Daten",
    dexie:
      "CAT-Namen, Ticker und Icons stammen aus der öffentlichen Registry von Dexie: <code>GET https://api.dexie.space/v1/assets?type=cat</code> (paginiert, 100 pro Seite), Icons unter <code>https://icons.dexie.space/{asset_id}.webp</code>.",
    mintgarden:
      "NFT-Metadaten und -Bilder stammen von MintGarden: <code>GET https://api.mintgarden.io/nfts/{nft1_id}</code>.",
  },
  embeds: {
    title: "Embeds und Badges",
    theme: "Embed-Design",
    dark: "dunkel",
    light: "hell",
    intro:
      "Fertige Widgets für Pools, Wallets und Community-Seiten. Jedes ist eine kleine statische Seite (unter 15 KB Skript, kein Framework), die Coinset direkt aus dem Browser des Besuchers abfragt – nichts über Ihre Besucher erreicht uns. <code>?theme=dark|light</code> wählt die Farben, <code>&network=testnet11</code> wechselt das Netzwerk. Sie dürfen von jedem Origin eingebettet werden.",
    preview: "Vorschau",
    items: {
      blocks: {
        title: "Block-Warteschlange",
        what: "Die voraussichtlichen nächsten Blöcke und die letzten drei Transaktionsblöcke.",
      },
      fees: {
        title: "Gebührenkarten",
        what: "Die Gebührenschätzung des Nodes für den nächsten Block, ~5 und ~10 Minuten.",
      },
      mempool: {
        title: "Mempool-Auslastung",
        what: "Wartende Bundles, genutzte Kosten der Node-Kapazität, Gebühren gesamt.",
      },
      tx: {
        title: "Transaktionsstatus",
        what: "Ausstehend, bestätigt oder entfernt für eine Transaktions-ID.",
      },
    },
    badgeTitle: "SVG-Badge",
    badgeWhat:
      "Ein Bild im Shields-Stil für READMEs und Seiten, die keine Skripte ausführen können; von mempoolxch.space ausgeliefert, eine Minute zwischengespeichert.",
  },
  fairUse: {
    title: "Rate Limits und faire Nutzung",
    limits:
      "Das sind die Endpunkte von Coinset, Dexie und MintGarden, nicht unsere: Wir können ihre Rate Limits nicht festlegen, und derzeit sind keine veröffentlicht. Seien Sie rücksichtsvoll – cachen Sie, was Sie abrufen, bündeln Sie Anfragen, wo ein Endpunkt es erlaubt (zum Beispiel der Höhenbereich von <code>get_block_records</code>, begrenzt auf 1.000 pro Aufruf), und fragen Sie nicht öfter ab als etwa einmal pro Block (~18–20 s im Mainnet).",
    terms:
      "Für diese Website selbst gelten weiterhin die <link>Nutzungsbedingungen</link> von mempoolxch.space (Verfügbarkeit, zulässige Nutzung der hier geladenen Seiten); die direkte Nutzung von Coinset, Dexie oder MintGarden ist eine Sache zwischen Ihnen und diesen Anbietern.",
  },
};

export default messages;
