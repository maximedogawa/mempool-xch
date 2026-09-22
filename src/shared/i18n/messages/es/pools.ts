import type { Translation } from "../../translate";
import type en from "../en/pools";

const messages: Translation<typeof en> = {
  title: "Pools",
  group: {
    selfPooled: "Farmer con pool propio",
    unnamed: "Pool sin nombre",
    unknown: "Desconocido",
    everyoneElse: "todos los demás",
  },
  bar: {
    label: "Cuota de los últimos {count} bloques: {summary}",
  },
  stats: {
    blocks: "Bloques",
    heights: "alturas {start} – {end}",
    largest: "Mayor",
    largestHint: "El mayor grupo individual en la ventana.",
    named: "Pools con nombre",
    namedSub: "{blocks} bloques · {pools} pools",
    namedHint:
      "Cuota ganada por pools del registro, cada uno confirmado mediante su propio endpoint pool_info u otra fuente registrada.",
    payouts: "Direcciones de pago",
    payoutsSub: "en {count} grupos",
    payoutsHint:
      "Direcciones de pago de pool distintas que ganaron un bloque en la ventana. Cada farmer con PlotNFT tiene la suya, así que un pool tiene muchas.",
  },
  share: {
    title: "Cuota por pool",
    search: "Buscar pool o dirección",
    loadError: "No se pudo cargar la cuota de pools",
    noClaims:
      "Los cobros de recompensas vienen de la API indexada de Coinset, que un nodo propio no ofrece: aquí los farmers con PlotNFT aparecen uno a uno en lugar de bajo su pool.",
    resolving: {
      one: "Comprobando dónde cobra sus recompensas {count} dirección de pago; los pools crecen a medida que llegan resultados. Tu navegador los recuerda para la próxima visita.",
      other:
        "Comprobando dónde cobran sus recompensas {count} direcciones de pago; los pools crecen a medida que llegan resultados. Tu navegador los recuerda para la próxima visita.",
    },
    noMatch: "Ningún pool ni dirección coincide con «{search}».",
    colPool: "Pool",
    colPayouts: "Direcciones de pago",
    colBlocks: "Bloques",
    colShare: "Cuota",
    showTop: "Mostrar los {count} primeros",
    showAll: "Mostrar las {count} filas",
  },
  row: {
    bothShares: "ambas partes",
    bothSharesHint:
      "La recompensa del pool (7/8) y la del farmer (1/8) van a la misma dirección en cada bloque, así que no es un PlotNFT del protocolo oficial de pools: es un farmer en solitario o un operador con su propio protocolo.",
    claimsTo: "cobra en <hash></hash>",
    showFewer: "Mostrar menos",
    more: "+{count} más",
  },
  footnote:
    "La dirección de pago de un bloque y el cobro que la vacía están ambos en cadena, así que la agrupación es exacta; solo los nombres vienen de un registro, cotejados con la dirección de destino que un pool publica en su endpoint <code>pool_info</code>. Una dirección cuyas recompensas nunca se cobraron (un PlotNFT nuevo o un pool que aún no ha cobrado) sigue como «Desconocido» hasta que ocurra. ¿Conoces un pool que falta? Añade una entrada con fuente a <code>src/shared/lib/pools/registry.json</code> (consulta la nota de contribución de la wiki).",
};

export default messages;
