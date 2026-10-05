import type { Translation } from "../../translate";
import type en from "../en/coin";

const messages: Translation<(typeof en)["messages"]> = {
  heading: "Moneda",
  spent: "Gastada",
  unspent: "Sin gastar",
  retry: "Reintentar",
  noId: {
    title: "Sin ID de moneda",
    description:
      "Abre una moneda desde una transacción o pega un ID de moneda en el cuadro de búsqueda.",
  },
  notFound: {
    title: "Moneda no encontrada",
    description:
      "No existe ninguna moneda con este ID en esta red. Las monedas creadas por un spend bundle pendiente solo aparecen cuando el bundle se confirma.",
  },
  loadError: "No se pudo cargar la moneda",
  stats: {
    amount: "Importe",
    created: "Creada",
    spent: "Gastada",
    blockHeight: "altura de bloque",
    spendPending: "gasto pendiente en la mempool",
    noPendingSpend: "sin gasto pendiente",
    origin: "Origen",
    reward: "Recompensa",
    spend: "Gasto",
    rewardSub: "coinbase (recompensa de farmer o de pool)",
    spendSub: "creada por un spend bundle",
  },
  record: {
    title: "Registro de la moneda",
    coinId: "ID de moneda",
    parentCoin: "Moneda padre",
    noParent: "(recompensa: sin moneda padre)",
    puzzleHash: "Puzzle hash",
    address: "Dirección",
    owner: "Propietario (puzzle interno): <address></address>",
    creatingTx: "Transacción de creación",
    spendingTx: "Transacción de gasto",
    rewardCoin: "ninguna (moneda de recompensa)",
    notAvailable: "Coinset no lo ofrece en este momento",
    needsCoinset: "requiere Coinset",
    block: "bloque {height}",
    unspent: "sin gastar",
  },
  type: {
    title: "Tipo y activo",
    needsCoinset:
      "La clasificación de monedas (XCH, CAT, NFT, DID) requiere un endpoint de Coinset; el nodo propio actual solo proporciona el registro sin procesar.",
    kind: "Tipo",
    custodyPuzzle: "Puzzle de custodia",
    catAssetId: "ID de activo CAT",
    nft: "NFT",
    launcherId: "Launcher ID",
    notClassified:
      "Coinset no ha clasificado esta moneda (su endpoint de detalles de monedas no está disponible o la moneda aún no está indexada). Las monedas XCH simples no suelen necesitar clasificación.",
  },
  pending: {
    title: "Gastos pendientes en la mempool",
    none: "Ningún spend bundle de la mempool gasta esta moneda.",
    spendBundle: "Spend bundle",
    fee: "Comisión",
    cost: "Coste",
    feePerCost: "Comisión / coste",
  },
  children: {
    title: "Hijas",
    titleCount: "Hijas ({count})",
    noneSpent: "No se encontraron monedas hijas para esta moneda.",
    noneUnspent: "Las monedas sin gastar aún no tienen hijas.",
    coinId: "ID de moneda",
    address: "Dirección",
    amount: "Importe",
    status: "Estado",
    spentAt: "gastada en {height}",
    unspent: "sin gastar",
  },
};

export default messages;
