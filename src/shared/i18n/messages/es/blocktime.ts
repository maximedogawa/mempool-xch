import type { Translation } from "../../translate";
import type en from "../en/blocktime";

const messages: Translation<typeof en> = {
  title: "Tiempo de bloque",
  hint: "Chia genera un bloque aproximadamente cada 18,75 segundos, pero solo uno de cada tres lleva transacciones. La barra avanza hasta el intervalo esperado entre bloques de transacciones.",
  sinceLast: "Desde el último bloque de transacciones",
  expectedGap: "Intervalo esperado",
  progressLabel: "Progreso hacia el próximo bloque de transacciones esperado",
  avgBlock: "Bloque medio",
  seconds: "{seconds} s",
  txBlocks: "Bloques tx",
  observedGap: "Intervalo observado",
  netspace: "Netspace",
  pushedTitle: "Enviado por Coinset {age} · dificultad {difficulty}",
  fromState: "De get_blockchain_state",
  footer: {
    one: "Pico {peak} · último bloque de transacciones {last} · ventana de {count} bloque",
    other: "Pico {peak} · último bloque de transacciones {last} · ventana de {count} bloques",
  },
  reorgRecent: {
    one: "reorg {age} ({count} bloque en #{height})",
    other: "reorg {age} ({count} bloques en #{height})",
  },
  reorgLast: {
    one: "última reorg {age} ({count} bloque en #{height})",
    other: "última reorg {age} ({count} bloques en #{height})",
  },
};

export default messages;
