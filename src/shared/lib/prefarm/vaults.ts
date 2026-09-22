/**
 * Chia Network's prefarm (21,000,000 XCH created in the genesis block) is held in four custody
 * vaults, each a singleton launched from a known launcher id. The launcher ids are the first 32
 * bytes of the public configs Chia Network publishes for its own audit tooling
 * (github.com/Chia-Network/prefarm-alert, singleton-metadata/*-public-config.txt; verified
 * 2026-09-18 against docs.chia.net's prefarm audit guide, which names the US cold launcher).
 *
 * Funds sit in the vault's singleton coin and in coins locked to the vault's puzzle hashes. The
 * p2 puzzle hashes below are the ones the vaults have used so far (a rekey changes them); they
 * are read from chain and any balance shown is exactly what those coins hold, nothing inferred.
 */
import { plainT } from "@/shared/i18n/plain";

export interface PrefarmVault {
  id: "cold-us" | "cold-ch" | "warm-us" | "warm-ch";
  name: string;
  region: "US" | "Switzerland";
  tier: "cold" | "warm";
  launcherId: string;
  /** Puzzle hashes (hex, no 0x) whose unspent coins count toward the vault. */
  puzzleHashes: string[];
  /** Custody rules as published by Chia Network. */
  custody: string;
}

export const PREFARM_TOTAL_MOJOS = 21_000_000n * 1_000_000_000_000n;

/** `name` and `custody` are getters so they follow the UI language at render time. */
export const PREFARM_VAULTS: PrefarmVault[] = [
  {
    id: "cold-us",
    get name() {
      return plainT("common")("vaults.coldUs");
    },
    region: "US",
    tier: "cold",
    launcherId: "6c77dce3c3bab525dab7883e8ad513a8f3ff127e872009b12836cbb1c8f26647",
    puzzleHashes: [
      // xch1yxqsmyuyjdlgxw4sqjg4vqlqv5ms2qzex00586nu643jqemmarwslh08yl (current singleton puzzle hash)
      "21810d9384937e833ab004915603e0653705005933df43ea7cd56320677be8dd",
      // xch1jj0gm4ahhlu3ke0r0fx955v8axr6za7rzz6hc0y26lewa7zw6fws5nwvv6 (p2 address in the audit guide)
      "949e8dd7b7bff91b65e37a4c5a5187e987a177c310b57c3c8ad7f2eef84ed25d",
    ],
    get custody() {
      return plainT("common")("vaults.custodyCold");
    },
  },
  {
    id: "cold-ch",
    get name() {
      return plainT("common")("vaults.coldCh");
    },
    region: "Switzerland",
    tier: "cold",
    launcherId: "355042db2e191d9176c25d3e059524265653549cee0fc65c4ed235d58bf8e659",
    puzzleHashes: [
      // xch1jn0mj65vyd8ra43y7napdp40tew7vk5s4fkvs5f5qt4msjzssfuqw2a2rl (current singleton puzzle hash)
      "94dfb96a8c234e3ed624f4fa1686af5e5de65a90aa6cc8513402ebb848508278",
      // xch1y6krqgs2cjz6mjgz5wy4dd5zqghm3a5pgueccjtudchn2xzcajtsnyzvgy
      "26ac30220ac485adc902a38956b682022fb8f68147338c497c6e2f351858ec97",
    ],
    get custody() {
      return plainT("common")("vaults.custodyCold");
    },
  },
  {
    id: "warm-us",
    get name() {
      return plainT("common")("vaults.warmUs");
    },
    region: "US",
    tier: "warm",
    launcherId: "d76ef7df8cfab2d8514f58e72fd12f2e7f5ada69db6eb5be90f084cfa37a29a2",
    puzzleHashes: [
      // xch12pc7qk46t8aktdsd7ss96pctdp0236sexakfsdvsqefuqyyll3hqzhnldc (current singleton puzzle hash)
      "5071e05aba59fb65b60df4205d070b685ea8ea19376c9835900653c0109ffc6e",
      // xch1aukdy3djga7j8ckaw06lwjew9pnnv5hugqyx9lu9l2utaxjtgj5snuuwkc
      "ef2cd245b2477d23e2dd73f5f74b2e28673652fc400862ff85fab8be9a4b44a9",
    ],
    get custody() {
      return plainT("common")("vaults.custodyWarm");
    },
  },
  {
    id: "warm-ch",
    get name() {
      return plainT("common")("vaults.warmCh");
    },
    region: "Switzerland",
    tier: "warm",
    launcherId: "a26cb54f7b9e8f38e2ee903880468ba262f5a1b39fe123c88053b14fac66ad10",
    puzzleHashes: [
      // xch18hp0afeqmcvn675dqpnxfhk7gggwcpjaa0huc45huu79tkaa28dsuse43w (current singleton puzzle hash)
      "3dc2fea720de193d7a8d006664dede4210ec065debefcc5697e73c55dbbd51db",
      // xch1xhghtsdqdtt5eqr307lcacg49nt72zmeuq2qfwu7ymmqvqf0ej0qsruh0w
      "35d175c1a06ad74c80717fbf8ee1152cd7e50b79e01404bb9e26f606012fcc9e",
    ],
    get custody() {
      return plainT("common")("vaults.custodyWarm");
    },
  },
];

export interface VaultCoin {
  name: string;
  puzzleHash: string;
  amount: bigint;
  confirmedHeight: number;
  timestamp: number;
}

export interface VaultBalance {
  vault: PrefarmVault;
  /** The vault's current singleton coin (null when the launcher did not resolve). */
  singleton: { amount: bigint; puzzleHash: string; height: number } | null;
  coins: VaultCoin[];
  /** Singleton coin plus every unspent coin at the vault's puzzle hashes, deduplicated by coin id. */
  total: bigint;
  /** Height of the most recent coin creation seen, a proxy for "last movement". */
  lastActivityHeight: number | null;
  lastActivityTimestamp: number | null;
}

/** Combines a vault's singleton coin and address coins into one balance; pure for tests. */
export function summariseVault(
  vault: PrefarmVault,
  singleton: VaultBalance["singleton"],
  coins: VaultCoin[],
  singletonCoinName: string | null
): VaultBalance {
  const seen = new Set<string>();
  const unique = coins.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
  let total = unique.reduce((s, c) => s + c.amount, 0n);
  // The singleton coin is usually locked to one of the listed puzzle hashes; count it once.
  if (singleton && singletonCoinName && !seen.has(singletonCoinName)) total += singleton.amount;
  const latest = unique.reduce<VaultCoin | null>(
    (best, c) => (!best || c.confirmedHeight > best.confirmedHeight ? c : best),
    null
  );
  return {
    vault,
    singleton,
    coins: unique,
    total,
    lastActivityHeight: latest?.confirmedHeight ?? singleton?.height ?? null,
    lastActivityTimestamp: latest?.timestamp ?? null,
  };
}
