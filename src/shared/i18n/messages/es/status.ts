import type { Translation } from "../../translate";
import type en from "../en/status";

const messages: Translation<typeof en> = {
  title: "Estado",
  tooltip:
    "Medido ahora mismo desde tu navegador, igual que las páginas obtienen sus datos. No hay monitor en el servidor ni historial; una fila roja significa que tu conexión no puede alcanzar ese servicio en este momento.",
  health: {
    ok: "Operativo",
    degraded: "Degradado",
    down: "Inaccesible",
    checking: "Comprobando",
  },
  overall: {
    ok: "Todos los servicios accesibles",
    degraded: "Algunos servicios van lentos o están degradados",
    down: "Algunos servicios son inaccesibles",
  },
  checked: "comprobado {age} · se vuelve a comprobar cada minuto",
  checking: "comprobando…",
  checkAgain: "Comprobar de nuevo",
  services: "Servicios",
  serviceList: "Estado de los servicios",
  latency: "{ms} ms",
  names: {
    coinsetRpc: "RPC de nodo completo de Coinset",
    ownNode: "Tu nodo (RPC de nodo completo)",
    indexed: "API indexada de Coinset",
    live: "Flujo en vivo",
    dns: "Introductores DNS de Chia",
  },
  what: {
    noIndexed: "no disponible con un nodo personalizado",
    pollingOnly: "solo sondeo",
    viaDns: "vía cloudflare-dns.com",
  },
  detail: {
    synced: "sincronizado · pico #{height}",
    notSynced: "no sincronizado · pico #{height}",
    lastReorg: "última reorganización {age}",
    answering: "responde",
    dexie: "el registro de tokens responde",
    mintgarden: "la API de NFT responde",
    seeder: { one: "{seeder}: {count} nodo", other: "{seeder}: {count} nodos" },
    geo: "la geolocalización responde",
    geoNoLocation: "respondió sin ubicación",
  },
  live: {
    state: {
      live: "en vivo",
      polling: "sondeo",
      connecting: "conectando",
      offline: "sin conexión",
    },
    websocket: "{state} por websocket",
    viaPolling: "{state} mediante sondeo",
    lastEvent: " · último evento {age}",
    peak: " · pico #{height}",
  },
  footnote:
    "El sitio en sí es una app estática servida desde mempoolxch.space (endpoint de salud <code>/up</code>); todo lo demás lo obtiene tu navegador de los servicios de arriba. Coinset publica su propio estado de forma independiente a esta página.",
};

export default messages;
