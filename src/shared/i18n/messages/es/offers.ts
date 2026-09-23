import type { Translation } from "../../translate";
import type en from "../en/offers";

const messages: Translation<typeof en> = {
  status: {
    open: "Abierta",
    pending: "Aceptándose",
    confirmed: "Aceptada",
    cancelPending: "Cancelándose",
    cancelled: "Cancelada",
    expired: "Caducada",
  },
  nothing: "nada",
  card: {
    title: "Ofertas",
    statusGroup: "Estado de la oferta",
    emptyAddress: {
      open: "No hay ofertas abiertas indexadas con esta dirección como creadora.",
      confirmed: "No hay ofertas aceptadas indexadas con esta dirección como creadora.",
      cancelled: "No hay ofertas canceladas indexadas con esta dirección como creadora.",
      expired: "No hay ofertas caducadas indexadas con esta dirección como creadora.",
      pending: "No hay ofertas en aceptación indexadas con esta dirección como creadora.",
    },
    emptyAsset: {
      open: "No hay ofertas abiertas indexadas para este activo.",
      confirmed: "No hay ofertas aceptadas indexadas para este activo.",
      cancelled: "No hay ofertas canceladas indexadas para este activo.",
      expired: "No hay ofertas caducadas indexadas para este activo.",
      pending: "No hay ofertas en aceptación indexadas para este activo.",
    },
    trade:
      "<muted>ofrece</muted> <offered></offered> <arrow></arrow> <muted>por</muted> <requested></requested>",
    by: "de <maker></maker>",
    details: "detalles",
    loading: "Cargando…",
    loadMore: "Cargar más",
  },
  page: {
    invalidTitle: "No es un ID de oferta válido",
    invalidDescription: "Se esperaba un ID de oferta hexadecimal de 32 bytes. Recibido: {raw}",
    empty: "(vacío)",
    needsCoinsetTitle: "Las ofertas requieren Coinset",
    needsCoinsetDescription:
      "El índice de ofertas forma parte de la API indexada de Coinset, que un nodo propio no tiene. Vuelve a poner Coinset como endpoint en los <link>ajustes</link> para buscar ofertas.",
    notIndexedTitle: "Oferta no indexada",
    notIndexedDescription:
      "Coinset no ha visto ninguna oferta con este ID. Las ofertas se indexan cuando se publican (por ejemplo en Dexie) o cuando un gasto que las acepta o cancela llega a la mempool; un archivo de oferta que nunca se compartió no se puede buscar por ID.",
    loadError: "No se pudo cargar la oferta",
    retry: "Reintentar",
    heading: "Oferta",
    status: "Estado",
    canBeTaken: "todavía se puede aceptar",
    takeInMempool: "la aceptación está en la mempool",
    cancelInMempool: "la cancelación está en la mempool",
    firstSeen: "Vista por primera vez",
    cancelled: "Cancelada",
    taken: "Aceptada",
    expires: "Caduca",
    beforeHeight: "antes de #{height}",
    setByMaker: "según lo fijó el creador",
    noExpiry: "sin caducidad",
    fee: "Comisión",
    offeredByMaker: "ofrecida por el creador",
    trade: "Intercambio",
    makerOffers: "El creador ofrece",
    makerRequests: "El creador pide",
    makerAddresses: { one: "Dirección del creador", other: "Direcciones del creador" },
    unknown: "Desconocida.",
    settlement: "Liquidación",
    takenIn: "Aceptada en la transacción <tx></tx>.",
    takenInBlock: "Aceptada en la transacción <tx></tx> en el bloque <block>#{height}</block>.",
    cancelledBy: "Cancelada por la transacción <tx></tx>.",
    cancelledByBlock:
      "Cancelada por la transacción <tx></tx> en el bloque <block>#{height}</block>.",
    beingTaken: "Se está aceptando en la transacción <tx></tx>.",
    beingTakenBlock:
      "Se está aceptando en la transacción <tx></tx> en el bloque <block>#{height}</block>.",
    notSettled: "Todavía nadie ha aceptado ni cancelado esta oferta on-chain.",
    noOfferFile:
      "Coinset indexa el estado de la oferta pero no el archivo de oferta, así que esta página no puede pasarlo a una billetera. Búscala en <link>Dexie</link> para aceptarla.",
  },
};

export default messages;
