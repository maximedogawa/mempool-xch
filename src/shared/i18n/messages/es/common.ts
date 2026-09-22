import type { Translation } from "../../translate";
import type en from "../en/common";

const messages: Translation<typeof en> = {
  channel: {
    customName: "Sondeo (nodo propio)",
    customDetail:
      "Consultando tu nodo en {host} cada pocos segundos; sin stream, el mempool se carga en el navegador.",
    offlineName: "Sin conexión",
    offlineDetail: "Sin conexión con {host}.",
    socketName: "Socket de Coinset",
    socketDetail: "Recibiendo eventos de pico y de transacciones directamente de {host}.",
    reconnectingName: "Socket de Coinset (reconectando)",
    reconnectingDetail: "Reconectando con {host}.",
    pollingName: "Sondeo",
    pollingDetail: "Consultando {host} cada pocos segundos.",
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
    poolClaims: { one: "{count} reclamación de pool", other: "{count} reclamaciones de pool" },
  },
  sensitivity: {
    title: "Contenido sensible",
    summary: "{title}. Motivo: {reason}",
  },
  pending: {
    broadcast: "Enviada a la red, aún no vista en el mempool",
    waiting: "En el mempool, detrás de los bloques proyectados",
    nextBlock: "Próximo bloque · posición {position} de {size}",
    projectedBlock: "Bloque proyectado {block} · posición {position} de {size}",
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
