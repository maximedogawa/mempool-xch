import type { Translation } from "../../translate";
import type en from "../en/portfolio";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Cartera",
  intro:
    "Lo que tienen su billetera Sage y las direcciones de su lista de seguimiento, y cuánto vale. Los precios de los tokens son la última operación de Dexie en XCH y XCH/USD es el precio spot de Gate.io; nada sale de su navegador. La variación de 24 horas es cuánto cambió el valor por el propio movimiento de XCH, ya que los precios de los tokens cotizan en XCH.",
  sources: "Origen",
  sourceAll: "Todo junto",
  sourceSage: "Billetera Sage",
  emptyTitle: "Aún no hay nada que mostrar",
  emptyDescription:
    "Abra mempoolxch.space dentro de la billetera Sage o añada una dirección a la lista de seguimiento en el panel, y sus tenencias aparecerán aquí.",
  toDashboard: "Ir al panel",
  watched: "Direcciones seguidas · {count}",
  needsIndexed:
    "Los saldos de direcciones necesitan la API indexada de Coinset, que el nodo seleccionado no ofrece.",
  loadError: "No se pudieron cargar algunos saldos. Las cifras pueden estar incompletas.",
  partial:
    "Solo se leyeron las últimas {count} transacciones de Sage, así que puede faltar un token movido por última vez antes.",
  total: "Valor total",
  totalXch: "≈ {value} XCH",
  noUsd: "Precio en USD no disponible",
  changeHint:
    "Variación del valor en 24 horas por el propio movimiento del precio de XCH (Gate.io). Los precios de los tokens cotizan en XCH, así que se mueven con él.",
  stats: {
    assets: "Activos",
    assetsSub: "{priced} con precio",
    largest: "Mayor posición",
    largestSub: "{share} del valor",
    unpriced: "Sin precio",
    unpricedSub: "fuera de los totales",
    unpricedNone: "todos los activos tienen precio",
    xchShare: "Parte en XCH",
    xchShareSub: "{value} XCH",
  },
  allocation: "Distribución",
  allocationLabel: "Distribución del valor de la cartera por activo",
  allocationEmpty:
    "Ninguna posición tiene todavía precio de mercado, así que no hay nada que repartir.",
  otherSlice: "Otros ({count})",
  holdings: "Tenencias",
  holdingsCount: "{count} activos",
  colAsset: "Activo",
  colPrice: "Precio",
  colAmount: "Tenencia",
  colValue: "Valor",
  colShare: "Distribución",
  noPrice: "sin precio",
  unknownToken: "Token desconocido",
  noHoldings: "Este origen no tiene XCH ni tokens.",
  unavailable: "No se pudo cargar ningún saldo para este origen.",
};

export default messages;
