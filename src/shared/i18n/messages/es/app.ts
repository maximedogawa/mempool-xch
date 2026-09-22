import type { Translation } from "../../translate";
import type en from "../en/app";

const messages: Translation<typeof en> = {
  invalidCoin: {
    title: "Id de moneda no válido",
    description: "Un id de moneda son 32 bytes en hex, con o sin prefijo 0x.",
  },
  invalidTx: {
    title: "Id de transacción no válido",
    description: "Un id de transacción (spend bundle) son 32 bytes en hex, con o sin prefijo 0x.",
  },
  noBlock: {
    title: "Ningún bloque seleccionado",
    description: "Busca una altura de bloque o un hash de cabecera.",
  },
};

export default messages;
