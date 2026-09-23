import type { Translation } from "../../translate";
import type en from "../en/goggles";

const messages: Translation<typeof en> = {
  title: "Nächster Block",
  colourBy: "Zellen einfärben nach",
  modeFee: "Gebühr",
  modeKind: "Art",
  kinds: {
    all: "Alle",
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    offer: "Offers",
    did: "DID",
    pool: "Pool",
    singleton: "Singleton",
  },
  empty: "Der Mempool ist leer: Der nächste Transaktionsblock wird keine Ausgaben enthalten.",
  ariaLabel: {
    one: "Zusammensetzung des nächsten Blocks: {count} Spend Bundle, {cost} von {max} Kosten ({percent} voll), {eta}",
    other:
      "Zusammensetzung des nächsten Blocks: {count} Spend Bundles, {cost} von {max} Kosten ({percent} voll), {eta}",
  },
  ariaLabelEmpty: "Zusammensetzung des nächsten Blocks",
  fullOf: "voll · {cost} von {max} Kosten",
  bundles: { one: "<b>{count}</b> Bundle", other: "<b>{count}</b> Bundles" },
  fees: "Gebühren <b>{amount}</b>",
  fresh: "<b>+{count}</b> in den letzten {seconds} s",
  filterKind: "Nach Asset-Art filtern",
  kindChipTitle: {
    one: "{count} Bundle · {cost} Kosten",
    other: "{count} Bundles · {cost} Kosten",
  },
  filterFee: "Nach Gebührenband filtern",
  anyFee: "Jede Gebühr",
  bandTitle: "{band} Mojo pro Kosteneinheit",
  zeroFee: "0 Gebühr",
  bandChip: "{band} m/c",
  showOnly: "Nur anzeigen",
  onlyNew: "Neu",
  onlyYours: "Ihre",
  cellLabel: "Spend Bundle {id}, {kind}, {amount}, Kosten {cost}, {rate} Mojo pro Kosteneinheit",
  cellLabelYours:
    "Ihr Spend Bundle {id}, {kind}, {amount}, Kosten {cost}, {rate} Mojo pro Kosteneinheit",
  yoursBadge: "IHRE",
  yoursChip: "Ihre",
  hoverCost: "{cost} Kosten · Gebühr {fee} · {rate} m/c",
  hoverSpends: {
    one: "{count} Coin-Ausgabe · gesehen {age}",
    other: "{count} Coin-Ausgaben · gesehen {age}",
  },
  showing: "<b>{matched}</b> von {total} Bundles · {cost} Kosten",
  packedHint:
    "Bundles werden nach Gebühr pro Kosteneinheit gepackt, in derselben Reihenfolge wie der Node; der Block füllt sich von unten nach oben.",
  legendSize: "Größe = Kosten",
  legendFee: "Farbe = Gebührenband",
  legendKind: "Farbe = Asset-Art",
  legendNew: "weißer Ring = neu",
  legendBandTitle: "{band} Mojo/Kosten",
};

export default messages;
