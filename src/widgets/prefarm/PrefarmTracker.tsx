"use client";

import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { coinName } from "@/shared/lib/chia/coin";
import { formatAge } from "@/shared/lib/format/time";
import { PREFARM_TOTAL_MOJOS, PREFARM_VAULTS, summariseVault, type VaultBalance, type VaultCoin } from "@/shared/lib/prefarm/vaults";
import { routes } from "@/shared/lib/routes";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Badge, Card, CardBody, CardHeader, Hash, Skeleton, StatTile, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";

async function loadVault(client: RpcClient, vault: (typeof PREFARM_VAULTS)[number], signal: AbortSignal): Promise<VaultBalance> {
  const [singletonRaw, ...coinLists] = await Promise.all([
    client.hasIndexed ? client.getSingletonInfo(vault.launcherId, signal).catch(() => null) : Promise.resolve(null),
    ...vault.puzzleHashes.map((ph) => client.getCoinRecordsByPuzzleHash(ph, false, signal)),
  ]);
  const coins: VaultCoin[] = coinLists.flat().map((r) => ({ name: r.name, puzzleHash: r.coin.puzzleHash, amount: r.coin.amount, confirmedHeight: r.confirmedBlockIndex, timestamp: r.timestamp }));
  const record = singletonRaw?.coinRecord as { coin?: { parent_coin_info?: string; puzzle_hash?: string; amount?: unknown }; confirmed_block_index?: number } | null | undefined;
  const coin = record?.coin;
  const singleton =
    coin && typeof coin.puzzle_hash === "string"
      ? { amount: BigInt(String(coin.amount ?? 0)), puzzleHash: coin.puzzle_hash.replace(/^0x/, ""), height: Number(record?.confirmed_block_index ?? 0) }
      : null;
  const singletonName = singleton && typeof coin?.parent_coin_info === "string" ? coinName({ parentCoinInfo: coin.parent_coin_info.replace(/^0x/, ""), puzzleHash: singleton.puzzleHash, amount: singleton.amount }) : null;
  return summariseVault(vault, singleton, coins, singletonName);
}

/**
 * Live balances of Chia Network's four prefarm custody vaults, read straight from chain: the
 * vault singleton (via Coinset's singleton index) and the unspent coins at the vault's known
 * puzzle hashes. Nothing is assumed about funds that moved elsewhere; the page says what the
 * coins say and points to Chia's own audit tooling for the full custody picture.
 */
export function PrefarmTracker() {
  const { client, endpoints, networkConfig } = useSettings();
  const network = endpoints.network;
  const results = useQueries({
    queries: PREFARM_VAULTS.map((vault) => ({
      queryKey: [...queryKeys.chainRoot(network), "prefarm", vault.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => loadVault(client, vault, signal),
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
    })),
  });
  const loaded = results.filter((r) => r.data).map((r) => r.data!);
  const tracked = loaded.reduce((s, v) => s + v.total, 0n);
  const loading = results.some((r) => r.isLoading);
  const cold = loaded.filter((v) => v.vault.tier === "cold").reduce((s, v) => s + v.total, 0n);
  const warm = loaded.filter((v) => v.vault.tier === "warm").reduce((s, v) => s + v.total, 0n);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Prefarm tracker</h1>
          <Tooltip
            text="Chia Network created 21 million XCH before the first block. It is held in four custody vaults (cold and warm, in the US and Switzerland) with published audit rules. This page reads the vaults' coins from the chain; it does not estimate anything."
            placement="bottom"
          />
        </div>
      </header>

      {network !== "mainnet" ? <p className="rounded-sm border border-warning/40 px-3 py-2 text-xs text-fg-muted">The prefarm vaults exist on mainnet only; switch the network to see them.</p> : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Tracked on chain" value={loading && loaded.length === 0 ? <Skeleton className="h-6 w-28" /> : formatAmount(tracked)} sub={`${formatPercent(Number(tracked) / Number(PREFARM_TOTAL_MOJOS), 1)} of the 21,000,000 XCH prefarm`} tone="primary" hint="Sum of the four vaults' singleton coins and unspent coins at their known puzzle hashes." />
        <StatTile label="Cold vaults" value={loaded.length ? formatAmount(cold) : "…"} sub="90-day clawback custody" />
        <StatTile label="Warm vaults" value={loaded.length ? formatAmount(warm) : "…"} sub="24-hour clawback custody" />
        <StatTile label="Not at these addresses" value={loaded.length === PREFARM_VAULTS.length ? formatAmount(PREFARM_TOTAL_MOJOS - tracked) : "…"} sub="spent, sold, or moved to addresses this page does not know" hint="The prefarm has funded purchases, market making and grants since 2021, and a vault rekey changes its puzzle hash. Whatever is not at the known addresses is listed here, not guessed at." />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PREFARM_VAULTS.map((vault, i) => {
          const r = results[i]!;
          const v = r.data;
          return (
            <Card key={vault.id}>
              <CardHeader title={vault.name} action={<Badge tone={vault.tier === "cold" ? "info" : "warning"}>{vault.tier}</Badge>} />
              <CardBody className="flex flex-col gap-3 text-sm">
                {r.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : r.error || !v ? (
                  <p className="text-danger">Could not read this vault&apos;s coins right now.</p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="tabular text-2xl font-semibold text-fg" data-testid={`prefarm-${vault.id}`}>
                        {formatAmount(v.total)}
                      </span>
                      <span className="text-xs text-fg-faint">
                        {formatNumber(v.coins.length)} coin{v.coins.length === 1 ? "" : "s"}
                        {v.lastActivityTimestamp ? ` · last movement ${formatAge(v.lastActivityTimestamp * 1000)}` : ""}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
                      <dt className="text-fg-muted">Custody</dt>
                      <dd>{vault.custody}</dd>
                      <dt className="text-fg-muted">Launcher</dt>
                      <dd>
                        <Hash value={vault.launcherId} head={10} tail={6} copy />
                        {v.singleton ? <span className="text-fg-faint"> · singleton coin at #{formatNumber(v.singleton.height)}</span> : null}
                      </dd>
                      <dt className="text-fg-muted">Addresses</dt>
                      <dd className="flex flex-col gap-0.5">
                        {vault.puzzleHashes.map((ph) => {
                          const address = puzzleHashToAddress(ph, networkConfig.addressPrefix);
                          const held = v.coins.filter((c) => c.puzzleHash === ph).reduce((s, c) => s + c.amount, 0n);
                          return (
                            <span key={ph} className="flex flex-wrap items-center gap-x-2">
                              <Hash value={address} href={routes.address(address)} head={10} tail={6} />
                              <span className="tabular text-fg-faint">{formatAmount(held)}</span>
                            </span>
                          );
                        })}
                      </dd>
                    </dl>
                  </>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-fg-faint">
        Vault launcher ids are the ones Chia Network publishes for its own audit tooling (
        <ExternalLink href="https://github.com/Chia-Network/prefarm-alert/tree/main/singleton-metadata">prefarm-alert</ExternalLink>); the custody rules are
        described in the{" "}
        <ExternalLink href="https://docs.chia.net/guides/custody/prefarm-audit/">prefarm audit guide</ExternalLink>. A vault rekey moves funds to a new puzzle
        hash; when that happens the balance here drops until the new address is added, which is why the &ldquo;not at these addresses&rdquo; figure is
        shown rather than folded into a total.
      </p>
    </div>
  );
}
