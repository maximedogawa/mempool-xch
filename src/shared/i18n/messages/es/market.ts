import type { Translation } from "../../translate";
import type en from "../en/market";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Mercado",
  intro:
    "Un campo de batalla en vivo de la liquidez de XCH entre libros de órdenes públicos y ofertas de Dexie. Los datos de mercado son solo informativos, no asesoramiento financiero.",
  quoteCurrency: "Moneda de cotización",
  animate: "Animar",
  reduceMotion: "Reducir movimiento",
  bestBid: "Mejor compra",
  bestAsk: "Mejor venta",
  exchangesLive: "{live}/3 exchanges en vivo",
  noLiveBooks: "Sin libros en vivo",
  crossSpread: "Spread entre exchanges",
  bidToAsk: "de mejor compra a mejor venta",
  sources: "Fuentes",
  updated: "actualizado {time}",
  waiting: "esperando",
  cexBooks: "Libros de órdenes CEX",
  cexIntro: "Libros públicos de XCH de Gate, OKX y HTX.",
  live: "EN VIVO",
  stale: "OBSOLETO",
  notAvailable: "no disponible",
  bid: "Compra",
  ask: "Venta",
  spread: "Spread",
  bids: "Compras",
  asks: "Ventas",
  amountPrice: "Cantidad · Precio",
  priceAmount: "Precio · Cantidad",
  sourceUnavailable: "Fuente no disponible",
  sourceExcluded: "Queda excluida del agregado hasta que llegue un libro actualizado.",
  dexieQuoteAsset: "Activo de cotización en Dexie",
  assetDescriptions: {
    byc: "Stablecoin descentralizada en USD de Circuit",
    wusdc: "CAT de USDC de warp.green",
  },
  dexiePair: "Par en Dexie",
  dexBid: "Compra DEX",
  dexAsk: "Venta DEX",
  dexStatus: "Estado DEX",
  dexStatusSub: "Ofertas abiertas, mejor precio",
  source: "Fuente",
  publicOffersApi: "API pública de ofertas",
  dexCexSpread: "Spread DEX / CEX",
  selectUsdc: "Selecciona USDC para comparar",
  differentQuote: "Activo de cotización distinto; comparación desactivada",
  waitingBoth: "Esperando ambos libros",
  dexNote:
    "Las cotizaciones de Dexie son ofertas por {asset}. No son directamente comparables con {quote} salvo que ambas usen el mismo activo de cotización. Los libros CEX de arriba están en {quote}.",
  howToRead: "Cómo leer esto",
  howToReadBody:
    "Los compradores se enfrentan a los vendedores alrededor del precio medio. La mejor compra es el precio más alto que ofrecen ahora los compradores; la mejor venta es el precio más bajo de los vendedores. Una fuente obsoleta sigue visible con su última actualización y nunca afecta al agregado entre exchanges.",
  inspired:
    "Inspirado en el diseño de campo de batalla de <link>XCHMempool Battlefield</link>; la implementación y el diseño de esta página son originales.",
  emptyBook: "Libro de órdenes vacío",
  unavailable: "No disponible",
};

export default messages;
