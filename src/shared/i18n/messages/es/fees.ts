import type { Translation } from "../../translate";
import type en from "../en/fees";

const messages: Translation<typeof en> = {
  cards: {
    title: "Comisiones de transacción",
    hint: "En Chia las comisiones se pagan por coste CLVM, no por byte. Las estimaciones son para un gasto de referencia de {cost} de coste (un envío típico de XCH). Multiplica la tasa en mojo por unidad de coste por el coste de tu gasto para obtener la comisión.",
    targets: {
      nextBlock: "Próximo bloque",
      fiveMinutes: "~5 minutos",
      tenMinutes: "~10 minutos",
    },
    mojoPerCost: "mojo/coste",
    notAvailable: "n/d",
    capacityAvailable: "Hay capacidad disponible.",
    zeroFeeAccepted: "Se aceptan gastos sin comisión.",
    aboveToEnter: "Más de {rate} mojo/coste para entrar.",
    nearCapacity: "Casi al límite.",
    fullMempool:
      "Un mempool lleno solo acepta al menos 5 mojo/coste y solo por encima de los gastos más baratos que puede desalojar.",
    paidAhead: "Los gastos con comisión pasan por delante de la cola sin comisión.",
    lastBlock:
      "El último bloque de transacciones pagó {fees} en comisiones a {rate} mojo/coste · tasa actual {current} mojo/coste.",
  },
  page: {
    title: "Comisiones",
    intro:
      "Lo que el nodo estima para una transferencia de {cost} de coste, la distribución actual de tasas en el mempool y lo que cuestan los tipos de gasto más comunes a la tasa actual. Se consulta a Coinset bajo demanda; no se guarda nada en nuestro servidor.",
    nodeEstimate: "Estimación del nodo",
    withinMinutes: { one: "En {count} min", other: "En {count} min" },
    rateSub: "{rate} mojo/coste",
    estimateNote:
      "get_fee_estimate con {cost} de coste. No se muestra la conversión a USD: aún no existe un endpoint público verificado de historial de precios (la misma carencia que el gráfico de Mercado en /charts).",
    rateDistribution: "Distribución de tasas",
    pendingBundles: { one: "{count} bundle pendiente", other: "{count} bundles pendientes" },
    colRate: "Mojo/coste",
    colBundles: "Bundles",
    colCost: "Coste",
    transferTitle: "Cuánto cuesta una transferencia",
    atCurrentRate: "a la tasa actual, {rate} mojo/coste",
    colSpend: "Gasto",
    colFee: "Comisión",
    feesChart: {
      title: "Comisiones por bloque de transacciones",
      definition: "Media de las comisiones totales pagadas en un bloque de transacciones.",
      technical:
        "Promediado por ventana de muestreo a partir de get_block_records (block_record.fees); número limitado de ventanas sea cual sea el rango.",
    },
    medianChart: {
      title: "Tasa de comisión mediana",
      definition:
        "La tasa de comisión central entre las transacciones de un bloque, a lo largo del tiempo.",
      technical:
        "No se muestrea a escala de gráfico: requiere los costes por transacción de cada bloque (una consulta indexada por bloque), demasiado pesado para muestrear un rango sin una caché en el servidor.",
      unavailable:
        "No se muestrea a escala de gráfico — requiere una consulta indexada por bloque. Las tasas de los bundles en el feed del mempool y en las páginas de transacción son exactas.",
    },
    footer:
      "Las tasas que se muestran en otros sitios — el feed del mempool y las páginas de transacciones y bloques — son cifras exactas por elemento, no muestreadas.",
  },
  transfers: {
    plain: "Transferencia simple",
    threeInputs: "Transferencia con 3 entradas",
    cat: "Enviar un CAT",
    nft: "Transferir un NFT",
    offer: "Aceptar una oferta",
  },
};

export default messages;
