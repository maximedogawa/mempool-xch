import type { Translation } from "../../translate";
import type en from "../en/charts";

const messages: Translation<(typeof en)["messages"]> = {
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
    sampledOnly:
      "Solo se muestrean las últimas 2 horas en este navegador; elige 6 h o 24 h para verlo.",
    sameSample: "La misma muestra de 2 horas del navegador que Coste usado.",
    perWindow: "Contado por ventana de muestreo a partir de get_block_records.",
    noNetspace:
      "No disponible en este endpoint: get_network_space no respondió para este endpoint.",
  },
  price: {
    title: "Precio de XCH (USDT)",
    definition: "El precio spot XCH/USDT a lo largo del tiempo: el precio de cierre de cada vela.",
    technical:
      "Velas spot públicas de Gate.io para XCH_USDT, una solicitud por rango (velas de 5 minutos para 6h hasta velas semanales para Todo). USDT sigue de cerca al dólar estadounidense, pero no es lo mismo.",
    unavailable:
      "El historial de precios de Gate.io no respondió. Se obtiene directamente desde este navegador; vuelve a intentarlo más tarde.",
  },
  costUsed: {
    title: "Coste usado",
    definition: "Coste CLVM total de todos los spend bundles pendientes.",
    technical:
      "Muestreado en este navegador cada vez que se actualiza el resumen de la mempool; se conserva durante 2 horas.",
    unavailable:
      "Solo se muestrean las últimas 2 horas en este navegador (Coinset no tiene endpoint de historial de la mempool); elige 6 h o 24 h para verlo.",
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
    definition:
      "La tasa de comisión en la mitad del coste pendiente: la mitad del coste que espera en la mempool paga más y la otra mitad paga menos.",
    technical:
      "Se muestrea en este navegador junto con las demás series de la mempool: los bundles se ordenan por tasa de comisión (mojos por unidad de coste) y se guarda la tasa en la mitad del coste pendiente total. Está ponderada por coste, así que unos pocos gastos grandes sin comisión la acercan a 0.",
  },
  feesPerTxBlock: {
    title: "Comisiones por bloque de transacciones",
    definition: "Comisiones totales medias pagadas en un bloque de transacciones.",
    technical:
      "Promediado por ventana de muestreo a partir de get_block_records (block_record.fees); número de ventanas acotado sea cual sea el rango.",
  },
  costPerTxBlock: {
    title: "Coste por bloque de transacciones",
    definition:
      "Coste CLVM usado por un bloque de transacciones, de los 11 mil millones que permite un bloque.",
    technical:
      "Para el bloque de transacciones más reciente de cada ventana de muestreo: transactions_info.cost de get_block. Un bloque por ventana (de 6 a 24 por rango), cada uno obtenido una vez por sesión.",
  },
  txBlocksPerHour: {
    title: "Bloques de transacciones por hora",
    definition: "Cuántos bloques de la ventana contenían transacciones.",
  },
  spendsPerTxBlock: {
    title: "Gastos por bloque de transacciones",
    definition: "Monedas gastadas en un bloque de transacciones.",
    technical:
      "Para los mismos bloques muestreados que Coste por bloque de transacciones: el número de removals de get_additions_and_removals. Los cobros de recompensa se crean, no se gastan, así que no se cuentan.",
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
    definition: "Espacio total estimado dedicado al farming en la red.",
    technical:
      "get_network_space entre el primer y el último bloque de cada ventana de muestreo — la propia estimación del nodo basada en la dificultad, no calculada por nosotros.",
  },
  difficulty: {
    title: "Dificultad",
    definition: "La dificultad de prueba de espacio con la que se farmearon los bloques.",
    technical:
      "A partir de los registros de bloque que ya obtienen las demás series: el peso de un bloque es la dificultad acumulada de la cadena, así que el salto de peso de una altura a la siguiente es la dificultad de ese bloque. Mediana por ventana de muestreo. Cambia una vez por época (4608 bloques).",
  },
  blocksPerHour: {
    title: "Bloques por hora",
    definition: "Todos los bloques (con y sin transacciones) por hora.",
  },
};

export default messages;
