/** Vaults page: Chia Vaults lookup and recovery activity (src/widgets/vaults). */
import { defineNamespace } from "../../translate";

const messages = {
  exampleLabel: "Chia Network's Buy XCH hot wallet",
  actions: {
    initiateRecovery: "Recovery started",
    finishRecovery: "Recovery finished",
    clawbackRecovery: "Recovery clawed back",
  },
  invalid: {
    checksum: "That looks like an address but its checksum is wrong.",
    format: "Paste a vault launcher id (64 hex characters) or the vault's xch address.",
  },
  title: "Chia Vaults",
  tooltip:
    "A Chia Vault keeps the right to spend outside the coins: a passkey, hardware key or m-of-n signers control a singleton, and a recovery path lets the owner regain access after a delay the vault can claw back. Coinset streams recovery steps but has no vault directory; the scanner linked below indexes all of them.",
  intro:
    "Look a vault up by its launcher id or its address, or browse them all on the <link>community vault scanner</link>.",
  lookup: {
    title: "Vault lookup",
    placeholder: "Vault launcher id or xch address",
    inputLabel: "Vault launcher id or address",
    submit: "Look up",
    example: "Try an example",
    needsCoinset:
      "The vault's singleton needs Coinset to look up; its funds are read from your node at the address derived from the launcher id.",
    vaultAddress: "Vault address <hash></hash>",
    noSingleton: "Coinset knows no singleton with this launcher id.",
    singleton: "Singleton",
    singletonFallback: "singleton",
    coinSpent: "current coin spent",
    coinUnspent: "current coin unspent",
    coinSince: "Current coin since",
    coinAmount: "Coin amount",
    coinAmountSub: "the singleton itself, not the vault's funds",
    funds: "Funds",
    fundsError: "could not load the vault's coins",
    unspentCoins: { one: "{count} unspent coin", other: "{count} unspent coins" },
    fundsHint:
      "A vault's funds sit at a puzzle hash derived from its launcher id (the vault's p2 singleton puzzle), computed here in the browser. This is the balance of the vault's main address; coins the vault moved to other addresses are not included.",
    launcher:
      "Launcher <launcher></launcher> · funds at <funds></funds> · current coin at <current></current> · <scanner>open on the scanner</scanner>",
    fullHistory: "<hash></hash> · full history on the address page.",
  },
  funds: {
    balance: "Balance",
    balanceSub: "unspent coins at this address",
    coins: "Coins",
    newestCoin: "Newest coin",
  },
  activity: {
    title: "Recovery activity",
    fromStream: "from Coinset's vault stream",
    needsStream: "needs the Coinset stream",
    empty:
      "No vault recovery seen on this connection yet. Recoveries are rare; events stay listed here across visits once one arrives.",
  },
};

export default defineNamespace("vaults", messages);
