import type { Translation } from "../../translate";
import type en from "../en/mempool";

const messages: Translation<typeof en> = {
  title: "Mempool",
  viewAll: "Ver todo →",
  spendBundles: "Spend bundles",
  summarised: "{count} resumidos",
  summarisedSyncing: "{count} resumidos · sincronizando",
  spendBundlesHint:
    "Número indicado por el nodo. Si el resumen aún se está poniendo al día tras un reinicio, la cifra resumida es menor durante unos segundos.",
  costUsed: "Coste usado",
  costUsedHint:
    "Coste CLVM total de todos los spend bundles pendientes frente al límite del mempool del nodo (10 bloques).",
  totalFees: "Comisiones totales",
  incoming: "Entrantes",
  perMinute: "{rate}/min",
  lastTenMinutes: "últimos 10 minutos",
  incomingHint: "Spend bundles vistos por primera vez en los últimos diez minutos, por minuto.",
  chartLabel: "Coste del mempool por franja de comisión a lo largo del tiempo",
  feeBands: "Franjas de comisión",
  bandLabel: "{band} mojo/coste",
  sampledSince: "Muestreado en este navegador desde las {time} (ventana de 2 h)",
  historyStarts: "El historial empieza cuando se abre la app por primera vez",
};

export default messages;
