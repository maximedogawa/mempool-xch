import type { Translation } from "../../translate";
import type en from "../en/app";

const messages: Translation<(typeof en)["messages"]> = {
  invalidCoin: {
    title: "ID de moneda no válido",
    description: "Un ID de moneda son 32 bytes en hex, con o sin prefijo 0x.",
  },
  invalidTx: {
    title: "ID de transacción no válido",
    description: "Un ID de transacción (spend bundle) son 32 bytes en hex, con o sin prefijo 0x.",
  },
  noBlock: {
    title: "Ningún bloque seleccionado",
    description: "Busca una altura de bloque o un hash de cabecera.",
  },
};

export default messages;
