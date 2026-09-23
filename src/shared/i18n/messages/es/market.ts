import type { Translation } from "../../translate";
import type en from "../en/market";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Mercado",
  intro:
    "Un campo de batalla en vivo de la liquidez de XCH entre libros de órdenes públicos y ofertas de Dexie. Los datos de mercado son solo informativos, no asesoramiento financiero.",
  quoteCurrency: "Moneda de cotización",
  reduceMotion: "Reducir movimiento",
  disclaimer:
    "Los precios, libros de órdenes y operaciones vienen directamente de exchanges de terceros y de Dexie y pueden llegar con retraso, incompletos o ser erróneos. Es solo información general, no asesoramiento financiero, de inversión, fiscal ni legal, ni una oferta de compra o venta. Consulta los <link>términos de uso</link>.",
  bestBid: "Mejor compra",
  bestAsk: "Mejor venta",
  onExchange: "en {exchange}",
  noLiveBooks: "Sin libros en vivo",
  crossSpread: "Spread entre exchanges",
  crossedBooks: "libros cruzados",
  bidToAsk: "de mejor compra a mejor venta",
  midPrice: "Precio medio",
  midSub: "entre la mejor compra y la mejor venta",
  sources: "Fuentes",
  updated: "actualizado {time}",
  waiting: "esperando",
  unlistedNote:
    "{exchanges} no listan XCH/{quote} (comprobado el 23-09-2026), así que la vista en {quote} solo muestra {listed}.",
  battlefield: "Campo de batalla",
  liveChart: "animado",
  staticChart: "estático",
  battlefieldIntro:
    "Los compradores (compras, a la izquierda) y los vendedores (ventas, a la derecha) de cada exchange se enfrentan alrededor del precio medio. El área rellena es la profundidad combinada de los libros en vivo, las líneas la profundidad de cada exchange y las verticales continuas la línea de frente en la mejor compra y la mejor venta. Las operaciones caen como impactos en el lado que tomaron.",
  chartSummary:
    "Gráfico de profundidad de {books} libros en vivo: mejor compra {bid}, mejor venta {ask}.",
  midLabel: "medio {price}",
  depthMax: "{amount} XCH",
  loadingBooks: "Cargando libros de órdenes…",
  legend: "Leyenda",
  legendBids: "compras combinadas",
  legendAsks: "ventas combinadas",
  legendHits: "▲ operaciones recientes a su precio",
  takerTitle: "Compradores frente a vendedores, última hora",
  buyers: "Compradores {share} %",
  sellers: "{share} % Vendedores",
  takerBarLabel: "Compras taker {buy} XCH, ventas taker {sell} XCH",
  takerNote:
    "Volumen taker de las últimas operaciones que devuelve cada exchange (hasta 30 por exchange), así que en días activos no cubre la hora entera.",
  fills: "Últimas operaciones",
  takerBuy: "Compra",
  takerSell: "Venta",
  noFills: "Todavía no hay operaciones.",
  cexBooks: "Libros de órdenes CEX",
  cexIntro:
    "Libros públicos de XCH de Gate, OKX y HTX, que tu navegador consulta cada 5 segundos mientras esta pestaña está visible.",
  live: "EN VIVO",
  stale: "OBSOLETO",
  lastUpdate: "última actualización {time}",
  notYet: "sin datos todavía",
  staleNote:
    "La última solicitud falló ({reason}). El libro de abajo es de la última actualización y queda fuera del agregado; próximo intento a las {retry}.",
  bid: "Compra",
  ask: "Venta",
  spread: "Spread",
  spreadPercent: "Spread %",
  bids: "Compras",
  asks: "Ventas",
  amountPrice: "Cantidad · Precio",
  priceAmount: "Precio · Cantidad",
  sourceUnavailable: "Fuente no disponible",
  sourceExcluded: "Queda excluida del agregado hasta que llegue un libro actualizado.",
  loadingBook: "Cargando…",
  dexTitle: "Dexie DEX · XCH / {asset}",
  dexieQuoteAsset: "Activo de cotización en Dexie",
  assetDescriptions: {
    byc: "Stablecoin descentralizada en USD de Circuit",
    wusdcb: "USDC de warp.green puenteado desde Base",
    wusdc: "USDC de warp.green puenteado desde Ethereum",
    wusdt: "USDT de warp.green puenteado desde Ethereum",
  },
  dexiePair: "Par en Dexie",
  dexBid: "Compra DEX",
  dexAsk: "Venta DEX",
  dexSpread: "Spread DEX",
  dexStatus: "Estado DEX",
  dexStatusSub: "mejores ofertas abiertas · {time}",
  dexStaleSub: "última actualización {time} · {reason}",
  dexCexSpread: "Medio DEX frente a medio CEX ({asset} frente a {quote})",
  dexCexPercent: "{percent} · DEX {dex} frente a CEX {cex}",
  waitingBoth: "Esperando ambos lados de ambos mercados",
  likeForLike: "{asset} es un {quote} envuelto, así que ambos lados cotizan el mismo dólar.",
  pegAssumption:
    "{asset} y {quote} son stablecoins en USD distintas; la comparación supone que ambas mantienen su paridad con el dólar.",
  catNote:
    "CAT de stablecoin usado: {label}, {description} (<link>{id}</link>). Los precios se calculan a partir de las cantidades de cada oferta, solo ofertas simples de XCH uno a uno.",
  howToRead: "Cómo leer esto",
  howToReadBody:
    "Los compradores se enfrentan a los vendedores alrededor del precio medio. La mejor compra es el precio más alto que ofrecen ahora los compradores; la mejor venta es el precio más bajo de los vendedores. Una fuente obsoleta sigue visible, en gris, con su última actualización y nunca afecta al agregado entre exchanges.",
  sourcesBody:
    "Fuentes: las API REST públicas de {exchanges} (libro de órdenes y operaciones recientes) y la API de ofertas de Dexie, todas consultadas por tu navegador. MEXC, KuCoin y CoinEx listan XCH, pero sus API REST no permiten solicitudes desde el navegador; Binance y Bybit no listan XCH.",
  inspired:
    "Inspirado en el diseño de campo de batalla de <link>XCHMempool Battlefield</link>; la implementación y el diseño de esta página son originales.",
};

export default messages;
