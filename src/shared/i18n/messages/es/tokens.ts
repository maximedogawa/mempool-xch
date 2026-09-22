import type { Translation } from "../../translate";
import type en from "../en/tokens";

const messages: Translation<typeof en> = {
  title: "Tokens",
  intro:
    "Todos los CAT para los que el registro de Dexie conoce un nombre, {total} en total. Precio, volumen y liquidez son datos de mercado de Dexie, todos en XCH para que los tokens se puedan comparar entre sí: el volumen es el XCH negociado contra el token y la liquidez, el lado XCH de sus ofertas abiertas (actualizado a diario). Una sola solicitud cubre los datos de mercado de todos los tokens; no guardamos nada en nuestro servidor. El historial on-chain está en la página de cada token.",
  searchPlaceholder: "Buscar nombre, ticker o ID de activo",
  searchLabel: "Buscar tokens",
  show: "Mostrar",
  period: "Periodo",
  sort: "Orden",
  windows: { d1: "24 h", d7: "7 d", d30: "30 d" },
  filters: {
    traded: "Negociados",
    tradedIn: "Negociados en {window}",
    liquid: "Con liquidez",
    priced: "Con precio",
    all: "Todos",
  },
  sorts: { volume: "Volumen", liquidity: "Liquidez", price: "Precio", name: "Nombre" },
  marketsError:
    "Los datos de mercado de Dexie no están disponibles ahora mismo, así que faltan precios y volumen.",
  tryAgain: "Reintentar",
  registryError: "No se pudo cargar el registro de tokens",
  noMatch: "Ningún token coincide con «{query}» en esta vista.",
  noTraded: {
    d1: "Ningún token se negoció en las últimas 24 horas.",
    d7: "Ningún token se negoció en los últimos 7 días.",
    d30: "Ningún token se negoció en los últimos 30 días.",
  },
  showAll: "Mostrar todos los tokens",
  colToken: "Token",
  colPrice: "Precio (XCH)",
  colVolume: "Volumen {window} (XCH)",
  colLiquidity: "Liquidez (XCH)",
  range: "{from}–{to} de {total}",
  previous: "Anterior",
  next: "Siguiente",
};

export default messages;
