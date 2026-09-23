import type { Translation } from "../../translate";
import type en from "../en/tx";

const messages: Translation<typeof en> = {
  heading: "Transacción",
  retry: "Reintentar",
  notAvailable: "n/d",
  unknown: "desconocido",
  noId: {
    title: "Sin ID de transacción",
    description: "Abre una transacción desde el panel o pega un ID en el cuadro de búsqueda.",
  },
  loadError: "No se pudo cargar la transacción",
  notFound: {
    title: "Transacción no encontrada",
    coinset:
      "No hay ningún spend bundle pendiente con este ID en la mempool y Coinset no tiene ninguna transacción confirmada o descartada con él. Los nodos no conservan los spend bundles que salieron de la mempool sin confirmarse, así que no se pueden mostrar.",
    customNode:
      "No hay ningún spend bundle pendiente con este ID en la mempool. Los nodos no conservan los spend bundles que salieron de la mempool sin confirmarse, así que no se pueden mostrar. Para consultar transacciones confirmadas hace falta un endpoint de Coinset; con un nodo propio, busca los ID de las monedas.",
  },
  pendingInIndex:
    "Pendiente en el índice. Esperando a que el nodo entregue el spend bundle; se comprueba cada 10 segundos.",
  rawJson: {
    show: "Mostrar JSON sin procesar",
    hide: "Ocultar JSON sin procesar",
    spendBundle: "Spend bundle",
    summary: "Resumen de la transacción",
  },
  memos: {
    title: "Memos ({count})",
    binary: "memo binario (probablemente un hint o un puzzle hash)",
  },
  event: {
    title: "Evento {n}",
    via: "vía {protocol}",
    participant: "Participante",
    sent: "Enviado",
    received: "Recibido",
    moreParticipants: {
      one: "…y {count} participante más (ver JSON sin procesar).",
      other: "…y {count} participantes más (ver JSON sin procesar).",
    },
    leg: "Tramo {n}",
    legSent: "enviado",
    legReceived: "recibido",
    minted: "{type} acuñado <asset></asset>",
    melted: "{type} fundido <asset></asset>",
  },
  summary: {
    title: "Resumen",
    hint: "Interpretación semántica del indexador de Coinset: quién envió y recibió qué activos.",
    noEvents: "No hay eventos semánticos para esta transacción.",
  },
  stats: {
    fee: "Comisión",
    zeroFeeSpend: "gasto sin comisión",
    cost: "Coste",
    clvmCost: "{cost} de coste CLVM",
    costHint: "Coste CLVM total del spend bundle; un bloque admite 11 mil millones de coste.",
    feePerCost: "Comisión / coste",
    mojoPerCost: "mojo por unidad de coste",
    projectedBlock: "Bloque previsto",
    projectedPosition: "{eta} · posición {position} de {total}",
    notInSummary: "aún no está en la mempool resumida",
    projectedHint:
      "Dónde quedaría este bundle si la mempool se empaquetara por comisión por coste en bloques de 11 mil millones de coste.",
    block: "Bloque",
    dropped: "Descartada",
    confirmations: {
      one: "{count} confirmación",
      other: "{count} confirmaciones",
    },
    removedFromMempool: "retirada de la mempool",
    time: "Hora",
    feeRate: "{rate} mojo / coste",
    inferredCost: "deducido de la cadena (sin coste registrado)",
    verdict: "Valoración",
  },
  pending: {
    line: "{coinSpends} · {removals} eliminadas → {additions} añadidas · gasta <amount></amount><assets></assets> · se actualiza en vivo; se refresca cada 10 s mientras está pendiente.",
    coinSpends: {
      one: "{count} gasto de moneda",
      other: "{count} gastos de monedas",
    },
    assets: {
      one: "activo",
      other: "activos",
    },
  },
  farmedBy: {
    line: "Farmeado por <who></who> · <link>detalles del bloque</link>",
    soloFarmer: "un farmer en solitario no identificado",
    unidentifiedPool: "un pool no identificado en <address></address>",
  },
  firstSeen: "Vista por primera vez en la mempool {age} ({date}).",
  waitedConfirming:
    "Esperó {duration} antes de confirmarse; dato basado en una muestra de primera detección, no en un hecho de consenso.",
  waitedRemoved:
    "Esperó {duration} antes de ser retirada; dato basado en una muestra de primera detección, no en un hecho de consenso.",
  coins: "Monedas",
  coinSpends: {
    title: "Gastos de monedas ({count})",
    inferredHint:
      "Coinset nunca vio este bundle en la mempool; los gastos se reconstruyen a partir del bloque en el que entró, así que la comisión y el coste son los que registra el bloque.",
    lineMempool:
      "{spent} gastadas → {created} creadas · {cost} de coste · gasta <amount></amount> · tal como se vio en la mempool",
    lineInferred:
      "{spent} gastadas → {created} creadas · {cost} de coste · gasta <amount></amount> · reconstruido a partir del bloque",
    coins: {
      one: "{count} moneda",
      other: "{count} monedas",
    },
  },
  flow: {
    inputs: "Entradas · eliminadas",
    outputs: "Salidas · añadidas",
    none: "Ninguna",
    more: "…y {count} más (ver JSON sin procesar).",
    coin: "moneda <hash></hash>",
    srSummary:
      "{inputs} entradas por un total de {totalIn} fluyen a {outputs} salidas por un total de {totalOut}; comisión {fee}. Entrada {first}.",
  },
  verdict: {
    noCostLabel: "Sin coste registrado",
    noCostDetail:
      "Este resumen se dedujo de la cadena, así que el coste y la tasa de comisión no están disponibles.",
    share: "{percent} de un bloque",
    noFeeLabel: "Sin comisión",
    noFeeDetail:
      "Usó {share}; el farmer la incluyó gratis o era lo bastante pequeña para caber de todos modos.",
    paidDetail: "Usó {share} con esta tasa de comisión.",
  },
};

export default messages;
