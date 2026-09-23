import type { Translation } from "../../translate";
import type en from "../en/address";

const messages: Translation<typeof en> = {
  notAvailable: "k. A.",
  needsCoinset: "erfordert Coinset",
  loading: "Wird geladen…",
  loadMore: "Mehr laden",
  retry: "Erneut versuchen",
  unavailable:
    "<b>Mit einem eigenen Node nicht verfügbar:</b> {what} erfordern die indexierte Coinset-API. Stellen Sie den Endpunkt in den <link>Einstellungen</link> wieder auf Coinset um, um sie zu sehen.",
  unavailableWhat:
    "Guthaben pro Asset, NFT-Anzahl sowie ausstehender und bestätigter Transaktionsverlauf",
  invalid: {
    title: "Keine gültige Adresse",
    description:
      "Erwartet wird eine {prefix}1…-Adresse, ein 32-Byte-Puzzle-Hash oder eine did:chia:-ID. Erhalten: {raw}",
    empty: "(leer)",
  },
  header: {
    did: "DID",
    address: "Adresse",
    qrLabel: "QR-Code für {address}",
    qrTitle: "QR-Code dieser Adresse",
    didId: "DID-ID",
    launcherId: "Launcher-ID",
    puzzleHash: "Puzzle-Hash",
    handles: "XCHandles",
    moreHandles: "+{count} weitere verweisen hierher",
    otherPrefix: "Präfix des anderen Netzwerks",
  },
  stats: {
    xchBalance: "XCH-Guthaben",
    pending: "ausstehend {amount}",
    noPendingChange: "keine ausstehende Änderung",
    fromUnspent: "aus nicht ausgegebenen Coins",
    catBalances: "CAT-Guthaben",
    tokensHeld: "gehaltene Token",
    nfts: "NFTs",
    didNftsSub: "gehalten · NFTs ansehen →",
    needsMainnet: "erfordert Mainnet",
    didNftsHint:
      "NFTs, die MintGarden dieser DID zuordnet, nicht Coins mit einem Hint auf ihre Launcher-ID.",
    ownedNftsSub: "im Besitz · NFTs ansehen →",
    unspentCoins: "Nicht ausgegebene Coins",
    unspentSub: "{xch} XCH · {hinted}",
    hinted: "{count} mit Hint",
    hintedNa: "mit Hint k. A.",
    unspentHint:
      "Coins, die an diesen Puzzle-Hash gebunden sind, plus CAT-, NFT- und DID-Coins mit einem Hint darauf.",
  },
  cats: {
    title: "CAT-Guthaben",
    token: "Token",
    tokenAlt: "Token",
    assetId: "Asset-ID",
    confirmed: "Bestätigt",
    pending: "Ausstehend",
  },
  pending: {
    title: "Ausstehende Transaktionen",
    titleCount: "Ausstehende Transaktionen ({count})",
    refreshes: "wird alle 10 s aktualisiert",
    empty: "Keine ausstehenden Transaktionen für diese Adresse.",
  },
  history: {
    title: "Transaktionsverlauf",
    unspentTitle: "Nicht ausgegebene Coins",
    empty: "Keine bestätigten Transaktionen für diese Adresse gefunden.",
  },
  offersTitle: "Von dieser Adresse erstellte Offers",
  coins: {
    empty: "Keine nicht ausgegebenen Coins.",
    coin: "Coin",
    type: "Typ",
    amount: "Betrag",
    confirmed: "Bestätigt",
    hintedAsset: "Asset mit Hint",
  },
  nfts: {
    didRegion: "NFTs der DID",
    addressRegion: "NFTs der Adresse",
    title: "Gehaltene NFTs",
    perPage: "{count} pro Seite · MintGarden",
    filterPage: "NFTs auf dieser Seite filtern",
    filterPlaceholder: "Diese Seite nach Name oder NFT-ID filtern",
    filterCollection: "NFTs nach Kollektion filtern",
    allCollections: "Alle Kollektionen",
    help: "Die Suche filtert diese Seite. Wählen Sie eine Kollektion aus einer besuchten Seite, um alle ihre Bestände zu durchsuchen.",
    loadError: "NFTs konnten nicht geladen werden.",
    noCollection: "Keine Kollektion",
    noMatch:
      "Keine NFTs auf dieser Seite passen. Versuchen Sie eine andere Seite oder löschen Sie den Filter.",
    empty: "Keine NFTs auf dieser Seite.",
    page: "Seite {page}",
    pageShown: "Seite {page} · {count} angezeigt",
    previous: "Zurück",
    next: "Nächste {count}",
  },
  clawbacks: {
    title: "Clawback-Coins",
    hint: "Coins, die mit einem Clawback-Timelock an diese Adresse gesendet wurden: Der Absender kann sie zurückholen, bis der Timelock endet; danach kann der Empfänger sie beanspruchen.",
    revocable: "{count} widerrufbar",
    coin: "Coin",
    amount: "Betrag",
    from: "Von",
    timelock: "Timelock",
    state: "Status",
    canClawBack: "Absender kann zurückholen",
    claimable: "beanspruchbar",
  },
};

export default messages;
