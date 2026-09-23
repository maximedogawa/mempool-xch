"use client";

import { useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { coinName } from "@/shared/lib/chia/coin";
import { formatAge } from "@/shared/lib/format/time";
import { createLimiter } from "@/shared/lib/limit";
import {
  PREFARM_TOTAL_MOJOS,
  PREFARM_VAULTS,
  summariseVault,
  type VaultBalance,
  type VaultCoin,
} from "@/shared/lib/prefarm/vaults";
import { routes } from "@/shared/lib/routes";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Badge, Card, CardBody, CardHeader, Hash, Skeleton, StatTile, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { formatInteger } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";

/**
 * Four vaults × three calls fired together is the kind of burst Coinset answers with a 503
 * (and no CORS header, so the browser reports it as a CORS failure); queue them instead.
 */
const limit = createLimiter(3);

async function loadVault(
  client: RpcClient,
  vault: (typeof PREFARM_VAULTS)[number],
  signal: AbortSignal
): Promise<VaultBalance> {
  const [singletonRaw, ...coinLists] = await Promise.all([
    client.hasIndexed
      ? limit(() => client.getSingletonInfo(vault.launcherId, signal)).catch(() => null)
      : Promise.resolve(null),
    ...vault.puzzleHashes.map((ph) =>
      limit(() => client.getCoinRecordsByPuzzleHash(ph, false, signal))
    ),
  ]);
  const coins: VaultCoin[] = coinLists.flat().map((r) => ({
    name: r.name,
    puzzleHash: r.coin.puzzleHash,
    amount: r.coin.amount,
    confirmedHeight: r.confirmedBlockIndex,
    timestamp: r.timestamp,
  }));
  const record = singletonRaw?.coinRecord as
    | {
        coin?: { parent_coin_info?: string; puzzle_hash?: string; amount?: unknown };
        confirmed_block_index?: number;
      }
    | null
    | undefined;
  const coin = record?.coin;
  const singleton =
    coin && typeof coin.puzzle_hash === "string"
      ? {
          amount: BigInt(String(coin.amount ?? 0)),
          puzzleHash: coin.puzzle_hash.replace(/^0x/, ""),
          height: Number(record?.confirmed_block_index ?? 0),
        }
      : null;
  const singletonName =
    singleton && typeof coin?.parent_coin_info === "string"
      ? coinName({
          parentCoinInfo: coin.parent_coin_info.replace(/^0x/, ""),
          puzzleHash: singleton.puzzleHash,
          amount: singleton.amount,
        })
      : null;
  return summariseVault(vault, singleton, coins, singletonName);
}

/**
 * Live balances of Chia Network's four prefarm custody vaults, read straight from chain: the
 * vault singleton (via Coinset's singleton index) and the unspent coins at the vault's known
 * puzzle hashes. Nothing is assumed about funds that moved elsewhere; the page says what the
 * coins say and points to Chia's own audit tooling for the full custody picture.
 */
export function PrefarmTracker() {
  const t = useT("prefarm");
  const { client, endpoints, networkConfig } = useSettings();
  const network = endpoints.network;
  const results = useQueries({
    queries: PREFARM_VAULTS.map((vault) => ({
      queryKey: [...queryKeys.chainRoot(network), "prefarm", vault.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => loadVault(client, vault, signal),
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt: number) => 1_500 * (attempt + 1),
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
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip text={t("tooltip")} placement="bottom" />
        </div>
      </header>

      {network !== "mainnet" ? (
        <p className="rounded-sm border border-warning/40 px-3 py-2 text-xs text-fg-muted">
          {t("mainnetOnly")}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile
          label={t("tracked")}
          value={
            loading && loaded.length === 0 ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              formatAmount(tracked)
            )
          }
          sub={t("trackedSub", {
            percent: formatPercent(Number(tracked) / Number(PREFARM_TOTAL_MOJOS), 1),
            total: formatInteger(21_000_000),
          })}
          tone="primary"
          hint={t("trackedHint")}
        />
        <StatTile
          label={t("cold")}
          value={loaded.length ? formatAmount(cold) : "…"}
          sub={t("coldSub")}
        />
        <StatTile
          label={t("warm")}
          value={loaded.length ? formatAmount(warm) : "…"}
          sub={t("warmSub")}
        />
        <StatTile
          label={t("elsewhere")}
          value={
            loaded.length === PREFARM_VAULTS.length
              ? formatAmount(PREFARM_TOTAL_MOJOS - tracked)
              : "…"
          }
          sub={t("elsewhereSub")}
          hint={t("elsewhereHint")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PREFARM_VAULTS.map((vault, i) => {
          const r = results[i]!;
          const v = r.data;
          return (
            <Card key={vault.id}>
              <CardHeader
                title={vault.name}
                action={
                  <Badge tone={vault.tier === "cold" ? "info" : "warning"}>
                    {t(`tier.${vault.tier}`)}
                  </Badge>
                }
              />
              <CardBody className="flex flex-col gap-3 text-sm">
                {r.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : r.error || !v ? (
                  <p className="text-danger">{t("readError")}</p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className="tabular text-2xl font-semibold text-fg"
                        data-testid={`prefarm-${vault.id}`}
                      >
                        {formatAmount(v.total)}
                      </span>
                      <span className="text-xs text-fg-faint">
                        {t("coins", { count: v.coins.length })}
                        {v.lastActivityTimestamp
                          ? t("lastMovement", { age: formatAge(v.lastActivityTimestamp * 1000) })
                          : ""}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
                      <dt className="text-fg-muted">{t("custody")}</dt>
                      <dd>{vault.custody}</dd>
                      <dt className="text-fg-muted">{t("launcher")}</dt>
                      <dd>
                        <Hash value={vault.launcherId} head={10} tail={6} copy />
                        {v.singleton ? (
                          <span className="text-fg-faint">
                            {" "}
                            {t("singletonAt", { height: formatNumber(v.singleton.height) })}
                          </span>
                        ) : null}
                      </dd>
                      <dt className="text-fg-muted">{t("addresses")}</dt>
                      <dd className="flex flex-col gap-0.5">
                        {vault.puzzleHashes.map((ph) => {
                          const address = puzzleHashToAddress(ph, networkConfig.addressPrefix);
                          const held = v.coins
                            .filter((c) => c.puzzleHash === ph)
                            .reduce((s, c) => s + c.amount, 0n);
                          return (
                            <span key={ph} className="flex flex-wrap items-center gap-x-2">
                              <Hash
                                value={address}
                                href={routes.address(address)}
                                head={10}
                                tail={6}
                              />
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
        {t.rich("footnote", {
          alert: (c) => (
            <ExternalLink href="https://github.com/Chia-Network/prefarm-alert/tree/main/singleton-metadata">
              {c}
            </ExternalLink>
          ),
          guide: (c) => (
            <ExternalLink href="https://docs.chia.net/guides/custody/prefarm-audit/">
              {c}
            </ExternalLink>
          ),
        })}
      </p>
    </div>
  );
}
