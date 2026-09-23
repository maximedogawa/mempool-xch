import type { Translation } from "../../translate";
import type en from "../en/wallet";

const messages: Translation<(typeof en)["messages"]> = {
  sageBadge: "de tu billetera Sage",
  enableInSage: "Activar en Sage",
  direction: {
    sent: "Enviado",
    received: "Recibido",
    transaction: "Transacción",
  },
  stats: {
    balance: "Saldo",
    pending: "Pendientes",
    inFlight: "transacciones en curso",
    coins: "Monedas",
    unspentInWallet: "sin gastar en la billetera",
    sync: "Sincronización",
    syncedCoins: "{synced} de {total} monedas",
    history: "Historial",
    historySub: "transacciones · {coins} monedas",
  },
  addressPanel: {
    title: "Tu billetera",
    open: "Abrir Mi billetera →",
  },
  coinPanel: {
    title: "Tu moneda",
    amount: "Importe",
    address: "Dirección",
    created: "Creada",
    spent: "Gastada",
    pending: "pendiente",
    unspent: "sin gastar",
    blockHeight: "altura de bloque",
    stillInWallet: "aún en la billetera",
  },
  priceChip: {
    title: "Precio de XCH de tu billetera Sage, {age}",
  },
  txRow: {
    pending: "Pendiente · {kind}",
    block: "bloque {height}",
    inMempool: "en la mempool",
  },
  loadMore: {
    transactions: "{loaded} de {total} transacciones",
    coins: "{loaded} de {total} monedas",
    loading: "Cargando…",
    more: "Cargar más",
  },
  enable: {
    assetBalances: "El acceso de Sage a los saldos de activos está desactivado.",
    balanceAddress: "El acceso de Sage a tu saldo y tu dirección está desactivado.",
    history: "El acceso de Sage a tu historial de transacciones está desactivado.",
    coins: "El acceso de Sage a tus monedas está desactivado.",
  },
  tabs: {
    label: "Secciones de la billetera",
    assets: "Activos",
    transactions: "Transacciones",
    coins: "Monedas",
  },
  asset: {
    owned: "{count} en posesión",
    txCount: "{count} tx",
    coins: { one: "{count} moneda", other: "{count} monedas" },
  },
  assets: {
    title: "Activos · {count}",
    partial:
      "vistos en las primeras {loaded} de {total} transacciones · desplázate por Transacciones para encontrar más",
  },
  page: {
    outsideTitle: "Abre mempoolxch.space dentro de la billetera Sage",
    outsideDescription:
      "Esta página lee saldos, transacciones pendientes, activos y monedas directamente de tu billetera. En un navegador, busca tu dirección.",
    backToDashboard: "Volver al panel",
    title: "Mi billetera",
    fromSage: "desde Sage",
    intro:
      "Los saldos, activos, transacciones y monedas vienen de tu billetera Sage; la mempool, los bloques y otras direcciones siguen viniendo de {network} a través del nodo configurado.",
    openAddress: "<link>Abrir esta dirección en el explorador</link>.",
    noAnswerTitle: "Sage no respondió",
    noAnswerDescription:
      "No se pudo contactar con el puente de la billetera. Vuelve a abrir la app desde la lista de apps de Sage.",
    receiveAddress: "Dirección de recepción",
    pendingTitle: "Pendientes · {count}",
    transactions: "Transacciones",
    newestFirst: "más recientes primero",
    noTransactions: "Aún no hay transacciones.",
    coins: "Monedas",
    unspentNewestFirst: "sin gastar, más recientes primero",
    noCoins: "No hay monedas que mostrar.",
    colCoin: "Moneda",
    colAddress: "Dirección",
    colAmount: "Importe",
    colCreated: "Creada",
  },
  pending: {
    title: "Tus transacciones en curso",
    titleCount: "Tus transacciones en curso · {count}",
    confirmedIn: "Confirmada en el bloque <link>{height}</link>",
    confirmed: "Confirmada",
    submitted: "enviada {age}",
    mute: "Silenciar el sonido de confirmación",
    unmute: "Reproducir un sonido cuando se confirme una transacción",
    chimeOn: "Sonido activado al confirmarse una transacción",
    chimeOff: "Sonido desactivado",
    walletLink: "Billetera",
    allowNotice: "Permite que Sage comparta las transacciones pendientes para seguirlas aquí.",
    reading: "Leyendo la billetera…",
    empty: "Nada en curso. Los nuevos envíos aparecen aquí con su lugar en la cola.",
  },
};

export default messages;
