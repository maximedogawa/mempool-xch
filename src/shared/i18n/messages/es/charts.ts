import type { Translation } from "../../translate";
import type en from "../en/charts";

const messages: Translation<typeof en> = {
  title: "Gráficos",
  tooltipCoinset:
    "Series generadas bajo demanda desde Coinset — no se guarda nada en nuestro servidor. Las series que ningún proveedor puede ofrecer aún no aparecen.",
  tooltipCustom:
    "Series generadas bajo demanda desde tu endpoint configurado — no se guarda nada en nuestro servidor. Las series que ningún proveedor puede ofrecer aún no aparecen.",
  sections: {
    market: "Mercado",
    mempool: "Mempool",
    blocks: "Bloques",
    network: "Red",
    coinSet: "Conjunto de monedas",
  },
  card: {
    latest: "Último",
    average: "Media",
    highest: "Máximo",
    points: "Puntos",
    notEnoughData: "Aún no hay suficientes datos.",
    definition: "Definición y nota técnica",
  },
  controls: {
    range: "Rango",
    smoothing: "Suavizado",
    scale: "Escala",
    linear: "Lineal",
    log: "Log",
  },
  notes: {
    noCoinset:
      "La API indexada de Coinset no tiene un endpoint agregado para esto (verificado con su especificación OpenAPI); un futuro proveedor como nodexch podría añadirlo.",
    needsCoinsetAggregate: "Necesitaría un endpoint agregado de Coinset.",
    sampledOnly:
      "Solo se muestrean las últimas 2 horas en este navegador; elige 6h o 24h para verlo.",
    sameSample: "La misma muestra de 2 horas del navegador que Coste usado.",
    perWindow: "Contado por ventana de muestreo a partir de get_block_records.",
    noNetspace:
      "No disponible en este endpoint: get_network_space no respondió para este endpoint.",
  },
  price: {
    title: "Precio de XCH (USD)",
    definition: "El precio spot XCH/USD a lo largo del tiempo.",
    technical: "Vendría de los datos de precios de Dexie.",
    unavailable:
      "Aún no hay un endpoint público verificado de historial de precios. La billetera Sage muestra un precio spot en vivo en la cabecera cuando está conectada; este gráfico necesita historial, para el que Dexie no publica hoy un endpoint documentado.",
  },
  costUsed: {
    title: "Coste usado",
    definition: "Coste CLVM total de todos los spend bundles pendientes.",
    technical:
      "Muestreado en este navegador cada vez que se actualiza el resumen de la mempool; se conserva durante 2 horas.",
    unavailable:
      "Solo se muestrean las últimas 2 horas en este navegador (Coinset no tiene endpoint de historial de la mempool); elige 6h o 24h para verlo.",
  },
  waitingBundles: {
    title: "Bundles en espera",
    definition: "Spend bundles que esperan en la mempool.",
  },
  totalFees: {
    title: "Comisiones totales",
    definition: "Suma de las comisiones ofrecidas por todos los spend bundles pendientes.",
  },
  medianFeeRate: {
    title: "Tasa de comisión mediana",
    definition: "La tasa de comisión central entre los spend bundles pendientes.",
    technical:
      "El muestreador del navegador aún no la registra (guarda totales por franja de comisión, no la distribución completa).",
    unavailable:
      "Aún no se muestrea: el historial de la mempool guarda totales por franja de comisión, lo que no basta para obtener una mediana.",
  },
  feesPerTxBlock: {
    title: "Comisiones por bloque de transacciones",
    definition: "Comisiones totales medias pagadas en un bloque de transacciones.",
    technical:
      "Promediado por ventana de muestreo a partir de get_block_records (block_record.fees); número de ventanas acotado sea cual sea el rango.",
  },
  costPerTxBlock: {
    title: "Coste por bloque de transacciones",
    definition: "Coste CLVM medio usado en un bloque de transacciones.",
    technical:
      "No se muestrea a escala de gráfico: el coste exacto requiere una consulta get_block completa por bloque, demasiado pesada para un rango sin caché en el servidor. Consulta la página de cada bloque para ver su coste exacto.",
    unavailable:
      "No se muestrea a escala de gráfico — requiere una consulta completa por bloque. Consulta la página de cada bloque para ver su coste exacto.",
  },
  txBlocksPerHour: {
    title: "Bloques de transacciones por hora",
    definition: "Cuántos bloques de la ventana contenían transacciones.",
  },
  spendsPerTxBlock: {
    title: "Gastos por bloque de transacciones",
    definition: "Número medio de monedas gastadas en un bloque de transacciones.",
    technical:
      "No se muestrea a escala de gráfico: requiere por bloque una consulta indexada o de additions/removals, demasiado pesada para un rango sin caché en el servidor. Consulta la página de cada bloque para ver sus gastos.",
    unavailable:
      "No se muestrea a escala de gráfico — requiere una consulta por bloque. Consulta la página de cada bloque para ver sus gastos.",
  },
  shareOfTxBlocks: {
    title: "Proporción de bloques de transacciones",
    definition:
      "Bloques de transacciones como proporción de todos los bloques (aproximadamente un tercio).",
  },
  timeBetweenTxBlocks: {
    title: "Tiempo entre bloques de transacciones",
    definition: "Intervalo medio entre bloques de transacciones consecutivos.",
    technical:
      "Promediado por ventana de muestreo a partir de las marcas de tiempo de get_block_records.",
  },
  netspace: {
    title: "Netspace",
    definition: "Espacio total estimado que hace farming en la red.",
    technical:
      "get_network_space entre el primer y el último bloque de cada ventana de muestreo — la propia estimación del nodo basada en la dificultad, no calculada por nosotros.",
  },
  difficulty: {
    title: "Dificultad",
    definition: "El objetivo de dificultad de prueba de espacio actual del nodo.",
    technical:
      "No hay una forma verificada de recuperar la dificultad histórica desde get_block_records; get_blockchain_state solo informa del valor actual.",
    unavailable:
      "No se puede derivar de los endpoints disponibles sin cálculos no verificados — un número erróneo aquí sería peor que ninguno. get_blockchain_state muestra el valor actual en Ajustes.",
  },
  blocksPerHour: {
    title: "Bloques por hora",
    definition: "Todos los bloques (con y sin transacciones) por hora.",
  },
  unspentCoins: {
    title: "Monedas sin gastar",
    definition: "Total de monedas aún no gastadas.",
  },
  activePuzzleHashes: {
    title: "Puzzle hashes activos",
    definition: "Puzzle hashes distintos que contienen monedas.",
  },
  coinAge: {
    title: "Antigüedad de las monedas",
    definition: "Antigüedad media de las monedas sin gastar.",
  },
};

export default messages;
