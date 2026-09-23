import type { Translation } from "../../translate";
import type en from "../en/handle";

const messages: Translation<typeof en> = {
  status: {
    active: "Registrado",
    expired: "Caducado",
    unknown: "No registrado",
    syncing: "Registro sincronizando",
    unavailable: "Registro inaccesible",
  },
  invalidTitle: "No es un handle válido",
  invalidDescription:
    "Un handle de XCHandles tiene de 3 a 63 letras minúsculas y dígitos, se escribe @nombre y no lleva puntos ni guiones. Recibido: {raw}",
  empty: "(vacío)",
  mainnetTitle: "Los handles son un registro de mainnet",
  mainnetDescription:
    "XCHandles solo funciona en mainnet. Vuelve a cambiar la red a mainnet para resolver un handle.",
  title: "Handle",
  artAlt: "NFT del nombre {handle}",
  handle: "Handle",
  resolvesTo: "Apunta a",
  nobodyRegistered: "Nadie ha registrado este handle.",
  noAddress: "No hay ninguna dirección a la que apuntar.",
  expired: "Caducó",
  expires: "Caduca",
  nameNft: "NFT del nombre",
  ownerLauncherId: "Launcher ID del propietario",
  syncing:
    "El índice del registro va por detrás de la cadena y prefiere avisarlo antes que responder con datos desactualizados. Inténtalo de nuevo en un momento.",
  unreachable: "No se pudo acceder al registro de XCHandles.",
  retry: "Reintentar",
  registry: "Registro",
  lastAction: "Última acción",
  confirmedIn: "Confirmado en",
  block: "Bloque {height}",
  protocolFee: "Comisión del protocolo",
  protocolFeeValue: "{fee} <faint>mojos del CAT de pago</faint>",
  notRegisteredTitle: "{handle} no está registrado",
  notRegisteredDescription:
    "Ningún slot activo del registro resuelve este handle. Se puede registrar en xchandles.com.",
  openOnXchandles: "Abrir en XCHandles",
};

export default messages;
