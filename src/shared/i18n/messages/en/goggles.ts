/** Next-block treemap "goggles" (src/widgets/goggles). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Next block",
  colourBy: "Colour cells by",
  modeFee: "Fee",
  modeKind: "Kind",
  kinds: {
    all: "All",
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    offer: "Offers",
    did: "DID",
    pool: "Pool",
    singleton: "Singleton",
  },
  empty: "The mempool is empty: the next transaction block will carry no spends.",
  ariaLabel: {
    one: "Next block composition: {count} spend bundle, {cost} of {max} cost ({percent} full), {eta}",
    other:
      "Next block composition: {count} spend bundles, {cost} of {max} cost ({percent} full), {eta}",
  },
  ariaLabelEmpty: "Next block composition",
  fullOf: "full · {cost} of {max} cost",
  bundles: { one: "<b>{count}</b> bundle", other: "<b>{count}</b> bundles" },
  fees: "fees <b>{amount}</b>",
  fresh: "<b>+{count}</b> in the last {seconds} s",
  filterKind: "Filter by asset kind",
  kindChipTitle: { one: "{count} bundle · {cost} cost", other: "{count} bundles · {cost} cost" },
  filterFee: "Filter by fee band",
  anyFee: "Any fee",
  bandTitle: "{band} mojo per cost",
  zeroFee: "0 fee",
  bandChip: "{band} m/c",
  showOnly: "Show only",
  onlyNew: "New",
  onlyYours: "Yours",
  cellLabel: "spend bundle {id}, {kind}, {amount}, cost {cost}, {rate} mojo per cost",
  cellLabelYours: "Your spend bundle {id}, {kind}, {amount}, cost {cost}, {rate} mojo per cost",
  yoursBadge: "YOURS",
  yoursChip: "yours",
  hoverCost: "{cost} cost · fee {fee} · {rate} m/c",
  hoverSpends: {
    one: "{count} coin spend · seen {age}",
    other: "{count} coin spends · seen {age}",
  },
  showing: "Showing <b>{matched}</b> of {total} bundles · {cost} cost",
  packedHint:
    "Bundles are packed by fee per cost, the same order the node uses; the block fills from the bottom up.",
  legendSize: "size = cost",
  legendFee: "colour = fee band",
  legendKind: "colour = asset kind",
  legendNew: "white ring = new",
  legendBandTitle: "{band} mojo/cost",
};

export default defineNamespace("goggles", messages);
