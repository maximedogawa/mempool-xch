import type { Translation } from "../../translate";
import type en from "../en/blocks";

const messages: Translation<(typeof en)["messages"]> = {
  row: {
    label: "Bloques",
    projected: "Previstos · próximos bloques",
    confirmed: "Confirmados · bloques de transacciones recientes",
  },
  projected: {
    emptyLabel: "La mempool está vacía: el próximo bloque no llevará transacciones",
    empty: "Vacía",
    mempool: "mempool",
    listLabel: "Próximos bloques previstos",
    cubeLabel:
      "Bloque previsto {n}: {bundles}{yours}{watched}, {percent} % lleno, tasa de comisión de {min} a {max} mojo por unidad de coste, {eta}",
    bundles: { one: "{count} spend bundle", other: "{count} spend bundles" },
    yoursPart: ", {count} tuyos",
    watchedPart: ", {count} seguidos",
    nextBlock: "Próximo bloque",
    zeroFee: "0 de comisión",
    txCount: "{count} tx · {cost}",
    yours: "{count} tuyos",
    inEta: "En {eta}",
  },
  details: {
    title: "Bloque previsto {n} · {bundles} · {cost} de coste · {eta}",
    bundles: { one: "{count} spend bundle", other: "{count} spend bundles" },
    close: "Cerrar",
    closeLabel: "Cerrar los detalles del bloque previsto",
    txId: "ID de tx",
    kind: "Tipo",
    fee: "Comisión",
    cost: "Coste",
    feePerCost: "Comisión / coste",
    value: "Valor",
    seen: "Visto",
    showingFirst:
      "Mostrando los primeros {shown} de {total}. <link>Abrir la tabla completa de la mempool</link>.",
  },
  recent: {
    listLabel: "Bloques de transacciones recientes",
    cubeLabel: "Bloque {height}{watched}, {age}, comisiones {fees}, {farmer}",
    watchedPart: ", {count} seguidos",
    farmedByPool: "farmeado por {pool}",
    farmerHash: "farmer {hash}",
    totalFees: "comisiones totales",
    moved: "{amount} movidos",
    rewardClaims: {
      one: "{count} cobro de recompensa",
      other: "{count} cobros de recompensas",
    },
    poolTitle: "{pool} · farmer {hash}",
    farmerTitle: "Farmer {hash}",
    gap: {
      one: "{count} bloque sin transacciones entre {newer} y {older} (no contienen gastos)",
      other: "{count} bloques sin transacciones entre {newer} y {older} (no contienen gastos)",
    },
    empty: "No hay bloques de transacciones en la ventana reciente ({cost} de coste cada uno).",
  },
  reorgs: {
    title: "Historial de reorgs",
    hint: "Un reorg sustituye el bloque o los bloques más recientes por una cadena competidora. En Chia los reorgs suelen tener un bloque de profundidad y son inofensivos; una transacción de un bloque reorganizado simplemente se vuelve a incluir un bloque después.",
    mostRecent: "Los {count} más recientes, según los detectó Coinset",
    empty: "No hay reorgs registrados.",
    detected: "Detectado",
    depth: "Profundidad",
    rolledBackTo: "Revertido a",
    oldPeak: "Pico anterior",
    newPeak: "Pico nuevo",
    depthValue: { one: "{count} bloque", other: "{count} bloques" },
    from: "desde #{height}",
  },
};

export default messages;
