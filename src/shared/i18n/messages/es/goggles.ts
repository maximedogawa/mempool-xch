import type { Translation } from "../../translate";
import type en from "../en/goggles";

const messages: Translation<typeof en> = {
  title: "Próximo bloque",
  colourBy: "Colorear celdas por",
  modeFee: "Comisión",
  modeKind: "Tipo",
  kinds: {
    all: "Todo",
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    offer: "Ofertas",
    did: "DID",
    pool: "Pool",
    singleton: "Singleton",
  },
  empty: "La mempool está vacía: el próximo bloque de transacciones no incluirá gastos.",
  ariaLabel: {
    one: "Composición del próximo bloque: {count} spend bundle, {cost} de {max} de coste ({percent} lleno), {eta}",
    other:
      "Composición del próximo bloque: {count} spend bundles, {cost} de {max} de coste ({percent} lleno), {eta}",
  },
  ariaLabelEmpty: "Composición del próximo bloque",
  fullOf: "lleno · {cost} de {max} de coste",
  bundles: { one: "<b>{count}</b> bundle", other: "<b>{count}</b> bundles" },
  fees: "comisiones <b>{amount}</b>",
  fresh: "<b>+{count}</b> en los últimos {seconds} s",
  filterKind: "Filtrar por tipo de activo",
  kindChipTitle: {
    one: "{count} bundle · {cost} de coste",
    other: "{count} bundles · {cost} de coste",
  },
  filterFee: "Filtrar por franja de comisión",
  anyFee: "Cualquier comisión",
  bandTitle: "{band} mojo por unidad de coste",
  zeroFee: "0 de comisión",
  bandChip: "{band} m/c",
  showOnly: "Mostrar solo",
  onlyNew: "Nuevos",
  onlyYours: "Tuyos",
  cellLabel: "spend bundle {id}, {kind}, {amount}, coste {cost}, {rate} mojo por unidad de coste",
  cellLabelYours:
    "Tu spend bundle {id}, {kind}, {amount}, coste {cost}, {rate} mojo por unidad de coste",
  yoursBadge: "TUYO",
  yoursChip: "tuyo",
  hoverCost: "{cost} de coste · comisión {fee} · {rate} m/c",
  hoverSpends: {
    one: "{count} gasto de moneda · visto {age}",
    other: "{count} gastos de monedas · visto {age}",
  },
  showing: "Mostrando <b>{matched}</b> de {total} bundles · {cost} de coste",
  packedHint:
    "Los bundles se ordenan por comisión por unidad de coste, en el mismo orden que usa el nodo; el bloque se llena de abajo hacia arriba.",
  legendSize: "tamaño = coste",
  legendFee: "color = franja de comisión",
  legendKind: "color = tipo de activo",
  legendNew: "anillo blanco = nuevo",
  legendBandTitle: "{band} mojo/coste",
};

export default messages;
