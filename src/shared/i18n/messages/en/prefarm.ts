/** Prefarm tracker: Chia Network's custody vaults (src/widgets/prefarm). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Prefarm tracker",
  tooltip:
    "Chia Network created 21 million XCH before the first block. It is held in four custody vaults (cold and warm, in the US and Switzerland) with published audit rules. This page reads the vaults' coins from the chain; it does not estimate anything.",
  mainnetOnly: "The prefarm vaults exist on mainnet only; switch the network to see them.",
  tracked: "Tracked on chain",
  trackedSub: "{percent} of the {total} XCH prefarm",
  trackedHint:
    "Sum of the four vaults' singleton coins and unspent coins at their known puzzle hashes.",
  cold: "Cold vaults",
  coldSub: "90-day clawback custody",
  warm: "Warm vaults",
  warmSub: "24-hour clawback custody",
  elsewhere: "Not at these addresses",
  elsewhereSub: "spent, sold, or moved to addresses this page does not know",
  elsewhereHint:
    "The prefarm has funded purchases, market making and grants since 2021, and a vault rekey changes its puzzle hash. Whatever is not at the known addresses is listed here, not guessed at.",
  tier: {
    cold: "cold",
    warm: "warm",
  },
  readError: "Could not read this vault's coins right now.",
  coins: { one: "{count} coin", other: "{count} coins" },
  lastMovement: " · last movement {age}",
  custody: "Custody",
  launcher: "Launcher",
  singletonAt: "· singleton coin at #{height}",
  addresses: "Addresses",
  footnote:
    "Vault launcher ids are the ones Chia Network publishes for its own audit tooling (<alert>prefarm-alert</alert>); the custody rules are described in the <guide>prefarm audit guide</guide>. A vault rekey moves funds to a new puzzle hash; when that happens the balance here drops until the new address is added, which is why the “not at these addresses” figure is shown rather than folded into a total.",
};

export default defineNamespace("prefarm", messages);
