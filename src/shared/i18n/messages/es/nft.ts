import type { Translation } from "../../translate";
import type en from "../en/nft";

const messages: Translation<typeof en> = {
  loading: "Cargando…",
  showMore: "Mostrar más",
  untitled: "Sin título",
  noAnswer: "MintGarden no respondió.",
  collectionsError: "No se pudieron cargar las colecciones",
  activityError: "No se pudo cargar la actividad",
  mintsError: "No se pudieron cargar los mints",
  noRecentMints: "No hay mints recientes.",
  home: {
    intro:
      "Colecciones, actividad y mints de MintGarden (solo mainnet) y ofertas abiertas de Dexie: se consultan bajo demanda y no se guarda nada en nuestro servidor. Las cifras de abajo corresponden a las 6 colecciones con más volumen en 30 días, no a un total de toda la plataforma: ningún proveedor lo publica.",
    topVolume: "Top colecciones, volumen 30 d",
    topVolumeHint: "Suma del volumen de 30 días de las 6 colecciones más activas.",
    topTrades: "Operaciones, top colecciones",
    recentActivity: "Actividad reciente",
    eventsShown: "eventos mostrados abajo",
    recentMints: "Mints recientes",
    mintsShown: "mints mostrados abajo",
    spotlight: "Colecciones destacadas",
    allCollections: "Todas las colecciones →",
    collectionAlt: "colección",
    floor: "suelo {price}",
    noFloor: "sin precio suelo",
    noCollections: "No hay datos de colecciones disponibles.",
    allActivity: "Toda la actividad →",
    noActivity: "No hay actividad reciente.",
    newMints: "Nuevos mints",
    allMints: "Todos los mints →",
    searchHint:
      "¿Tienes un ID de NFT o un launcher ID? Búscalo arriba o abre <mono>{path}</mono> directamente.",
  },
  collections: {
    title: "Colecciones NFT",
    intro:
      "Ordenadas por volumen negociado en el periodo, según MintGarden. El precio suelo es el listado activo más barato de MintGarden.",
    card: "Colecciones",
    search: "Buscar colecciones",
    window: "Periodo",
    intervals: { d1: "24 h", d7: "7 d", d30: "30 d", all: "Todo" },
    noMatch: "Ninguna colección coincide con «{query}».",
    colCollection: "Colección",
    colItems: "Elementos",
    colFloor: "Suelo",
    colVolume: "Volumen",
    colTrades: "Operaciones",
  },
  activity: {
    title: "Actividad NFT",
    intro:
      "Mints, transferencias, ventas y quemas en todas las colecciones que indexa MintGarden, de más reciente a más antigua.",
    card: "Actividad",
    kind: "Tipo",
    kinds: {
      all: "Todo",
      mint: "Mints",
      transfer: "Transferencias",
      trade: "Ventas",
      burn: "Quemas",
    },
    noEvents: "No hay eventos.",
  },
  mints: {
    title: "Nuevos mints",
    intro:
      "NFT recién minteados en todas las colecciones que indexa MintGarden, primero los más recientes.",
    card: "Mints",
  },
  event: {
    kinds: { mint: "Mint", transfer: "Transferencia", trade: "Venta", burn: "Quema" },
    uncategorised: "Sin categoría",
    block: "bloque {height}",
  },
  offers: {
    title: "Ofertas abiertas",
    titleCount: "Ofertas abiertas ({count})",
    found: "encontrada {age}",
    copyOfferFile: "Copiar archivo de oferta",
    viewOnDexie: "Ver en Dexie",
    none: "Ahora mismo no hay ofertas abiertas en Dexie.",
    howToAccept:
      "Para aceptar una, pega el archivo de oferta en Sage u otra billetera de Chia, o acéptala directamente en Dexie: esta app no puede enviar la operación por ti; el puente de apps de Sage todavía no ofrece una forma de aceptar ofertas.",
  },
  owned: {
    invalidTitle: "No es una dirección válida",
    invalidDescription:
      "Abre el recuento de NFT en la página de una dirección o de un DID para ver sus tenencias.",
    backToDid: "Volver al DID",
    backToAddress: "Volver a la dirección",
    title: "NFT en posesión",
    heldBy: "En posesión de <owner></owner>",
    mainnetTitle: "La galería de NFT está disponible en mainnet",
    mainnetDescription:
      "MintGarden no ofrece tenencias de testnet. El resumen de la dirección sigue mostrando el recuento de NFT del nodo.",
  },
};

export default messages;
