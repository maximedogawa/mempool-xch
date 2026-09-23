import type { Translation } from "../../translate";
import type en from "../en/ui";

const messages: Translation<(typeof en)["messages"]> = {
  copy: "Copiar",
  copyToClipboard: "{label} al portapapeles",
  yours: "tuya",
  capacity: {
    label: "Capacidad de la mempool",
    costOf: "{used} de {max} de coste",
    blocks: "{percent} · {filled}/{segments} bloques",
    valueText: "{used} de {max} de coste, {percent}",
  },
  kind: {
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    did: "DID",
    offer: "Oferta",
    pool: "Pool",
    singleton: "Singleton",
    unknown: "Desconocido",
  },
  summaryKind: {
    transfer: "Transferencia",
    swap: "Intercambio",
    mint: "Acuñación",
    melt: "Fundición",
    combine: "Combinación",
    split: "División",
    pool: "Pool",
    revoke: "Revocación",
    clawback: "Clawback",
    unknown: "Desconocido",
  },
  status: {
    pending: "Pendiente",
    confirmed: "Confirmada",
    removed: "Descartada",
    unknown: "Desconocida",
  },
  image: {
    noImage: "{alt} (sin imagen)",
    reason: "Motivo: ",
    video: "Vídeo",
    showAnyway: "Mostrar igualmente",
    clickToShow: "{summary} — haz clic para mostrar",
    veiled: "{alt}: {summary}",
    veiledButton: "{alt}: {summary}. Mostrar igualmente.",
  },
  cat: {
    unknown: "CAT desconocido · 0x{id}",
  },
  chart: {
    notEnough: "Aún no hay datos suficientes.",
    collecting: "Recogiendo muestras… el historial empieza cuando se abre la app.",
    lineSummary: {
      one: "{label}. {count} punto de {from} a {to}. Último: {latest}.",
      other: "{label}. {count} puntos de {from} a {to}. Último: {latest}.",
    },
    stackedSummary: {
      one: "{label}. {count} muestra de {from} a {to}. Último total: {latest}.",
      other: "{label}. {count} muestras de {from} a {to}. Último total: {latest}.",
    },
    total: "Total {value}",
  },
};

export default messages;
