import type { Translation } from "../../translate";
import type en from "../en/common";

const messages: Translation<(typeof en)["messages"]> = {
  channel: {
    customName: "Consultas (nodo propio)",
    customDetail:
      "Consultando tu nodo en {host} cada pocos segundos; un nodo propio no tiene flujo en vivo, la mempool se carga en el navegador.",
    offlineName: "Sin conexión",
    offlineDetail: "Sin conexión con {host}.",
    socketName: "Flujo en vivo (Coinset)",
    socketDetail: "Eventos de pico y de transacciones de {host} por websocket.",
    reconnectingName: "Flujo en vivo (Coinset, reconectando)",
    reconnectingDetail: "Reconectando con {host}.",
    nodexchSocketName: "Flujo en vivo (nodexch)",
    nodexchReconnectingName: "Flujo en vivo (nodexch, reconectando)",
    pollingName: "Consultas (sin flujo en vivo)",
    pollingDetail: "Sin flujo en vivo ahora: consultando {host} cada pocos segundos.",
  },
  rpcError: {
    network: "No se pudo contactar con el nodo. Revisa tu conexión o el endpoint configurado.",
    http: "El nodo respondió con HTTP {status}.",
    httpUnknown: "El nodo respondió con un error HTTP.",
    malformed: "El nodo devolvió una respuesta que no se pudo interpretar.",
    notFound: "No encontrado.",
    aborted: "Solicitud cancelada.",
  },
  assets: {
    nfts: { one: "{count} NFT", other: "{count} NFT" },
    dids: { one: "{count} DID", other: "{count} DID" },
    singletons: { one: "{count} singleton", other: "{count} singletons" },
    poolClaims: { one: "{count} cobro de pool", other: "{count} cobros de pool" },
  },
  sensitivity: {
    title: "Contenido sensible",
    summary: "{title}. Motivo: {reason}",
  },
  pending: {
    broadcast: "Enviada a la red, aún no vista en la mempool",
    waiting: "En la mempool, detrás de los bloques previstos",
    nextBlock: "Próximo bloque · posición {position} de {size}",
    projectedBlock: "Bloque previsto {block} · posición {position} de {size}",
    confirmed: "Confirmada",
    gone: "Ya no está pendiente en la billetera",
  },
  expiry: {
    lessThanDay: "menos de un día",
    days: { one: "{count} día", other: "{count} días" },
    months: { one: "{count} mes", other: "{count} meses" },
    years: { one: "{count} año", other: "{count} años" },
    ago: "hace {span}",
    in: "en {span}",
  },
  range: {
    all: "Todo",
  },
  smoothing: {
    raw: "Sin suavizar",
    smooth: "Suave",
    verySmooth: "Muy suave",
  },
  vaults: {
    coldUs: "Billetera fría (EE. UU.)",
    coldCh: "Billetera fría (Suiza)",
    warmUs: "Billetera templada (EE. UU.)",
    warmCh: "Billetera templada (Suiza)",
    custodyCold: "Clawback de 90 días, bloqueo de retirada de 30 días",
    custodyWarm: "Clawback de 24 horas, bloqueo de retirada de 1 hora",
  },
};

export default messages;
