import type { Translation } from "../../translate";
import type en from "../en/offers";

const messages: Translation<typeof en> = {
  status: {
    open: "Offen",
    pending: "Wird angenommen",
    confirmed: "Angenommen",
    cancelPending: "Wird storniert",
    cancelled: "Storniert",
    expired: "Abgelaufen",
  },
  nothing: "nichts",
  card: {
    title: "Offers",
    statusGroup: "Offer-Status",
    emptyAddress: {
      open: "Keine offenen Offers mit dieser Adresse als Maker indexiert.",
      confirmed: "Keine angenommenen Offers mit dieser Adresse als Maker indexiert.",
      cancelled: "Keine stornierten Offers mit dieser Adresse als Maker indexiert.",
      expired: "Keine abgelaufenen Offers mit dieser Adresse als Maker indexiert.",
      pending: "Keine gerade angenommenen Offers mit dieser Adresse als Maker indexiert.",
    },
    emptyAsset: {
      open: "Keine offenen Offers für dieses Asset indexiert.",
      confirmed: "Keine angenommenen Offers für dieses Asset indexiert.",
      cancelled: "Keine stornierten Offers für dieses Asset indexiert.",
      expired: "Keine abgelaufenen Offers für dieses Asset indexiert.",
      pending: "Keine gerade angenommenen Offers für dieses Asset indexiert.",
    },
    trade:
      "<muted>bietet</muted> <offered></offered> <arrow></arrow> <muted>für</muted> <requested></requested>",
    by: "von <maker></maker>",
    details: "Details",
    loading: "Wird geladen…",
    loadMore: "Mehr laden",
  },
  page: {
    invalidTitle: "Keine gültige Offer-ID",
    invalidDescription: "Erwartet wird eine 32-Byte-Hex-Offer-ID. Erhalten: {raw}",
    empty: "(leer)",
    needsCoinsetTitle: "Offers erfordern Coinset",
    needsCoinsetDescription:
      "Der Offer-Index ist Teil der indexierten API von Coinset, die ein eigener Node nicht hat. Stellen Sie den Endpunkt in den <link>Einstellungen</link> wieder auf Coinset, um Offers nachzuschlagen.",
    notIndexedTitle: "Offer nicht indexiert",
    notIndexedDescription:
      "Coinset hat kein Offer mit dieser ID gesehen. Offers werden indexiert, sobald sie veröffentlicht werden (zum Beispiel auf Dexie) oder sobald eine Ausgabe, die sie annimmt oder storniert, den Mempool erreicht; eine nie geteilte Offer-Datei lässt sich nicht per ID nachschlagen.",
    loadError: "Das Offer konnte nicht geladen werden",
    retry: "Erneut versuchen",
    heading: "Offer",
    status: "Status",
    canBeTaken: "kann noch angenommen werden",
    takeInMempool: "Annahme ist im Mempool",
    cancelInMempool: "Stornierung ist im Mempool",
    firstSeen: "Zuerst gesehen",
    cancelled: "Storniert",
    taken: "Angenommen",
    expires: "Läuft ab",
    beforeHeight: "vor #{height}",
    setByMaker: "vom Maker festgelegt",
    noExpiry: "kein Ablauf festgelegt",
    fee: "Gebühr",
    offeredByMaker: "vom Maker angeboten",
    trade: "Handel",
    makerOffers: "Maker bietet",
    makerRequests: "Maker verlangt",
    makerAddresses: { one: "Maker-Adresse", other: "Maker-Adressen" },
    unknown: "Unbekannt.",
    settlement: "Abwicklung",
    takenIn: "Angenommen in Transaktion <tx></tx>.",
    takenInBlock: "Angenommen in Transaktion <tx></tx> in Block <block>#{height}</block>.",
    cancelledBy: "Storniert durch Transaktion <tx></tx>.",
    cancelledByBlock: "Storniert durch Transaktion <tx></tx> in Block <block>#{height}</block>.",
    beingTaken: "Wird angenommen durch Transaktion <tx></tx>.",
    beingTakenBlock:
      "Wird angenommen durch Transaktion <tx></tx> in Block <block>#{height}</block>.",
    notSettled: "Bisher hat nichts dieses Offer on-chain angenommen oder storniert.",
    noOfferFile:
      "Coinset indexiert den Zustand des Offers, aber nicht die Offer-Datei, daher kann diese Seite sie nicht an eine Wallet übergeben. Suchen Sie es auf <link>Dexie</link>, um es anzunehmen.",
  },
};

export default messages;
