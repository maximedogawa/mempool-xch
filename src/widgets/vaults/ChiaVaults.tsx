"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { decodeBech32m, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { vaultP2PuzzleHash } from "@/shared/lib/chia/vault";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Hash,
  Skeleton,
  StatTile,
  Tooltip,
} from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { useT } from "@/shared/i18n/useT";
import vaultsNs from "@/shared/i18n/messages/en/vaults";

const SCANNER = "https://vaults.xchplorer.com";
const EVENTS_KEY = "mempool-xch:vault-events:v1";
const EVENTS_LIMIT = 30;

/** A Chia Vault everyone can check against: Chia Network's "Buy XCH" hot wallet (xch.ninja labels it; the scanner shows it as its largest vault). */
const EXAMPLE = {
  launcherId: "a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201",
  address: "xch1lv34uumcyg892zrv35rhrx87hu5nx87em7zcag5nc2vjecupkdzspc9xn6",
};

interface VaultEvent {
  vaultId: string;
  action: string;
  status: string;
  txId: string | null;
  at: number;
}

const ACTION_LABEL = {
  initiate_recovery: "actions.initiateRecovery",
  finish_recovery: "actions.finishRecovery",
  clawback_recovery: "actions.clawbackRecovery",
} as const;

function actionLabel(action: string): (typeof ACTION_LABEL)[keyof typeof ACTION_LABEL] | null {
  return Object.hasOwn(ACTION_LABEL, action)
    ? ACTION_LABEL[action as keyof typeof ACTION_LABEL]
    : null;
}

function loadEvents(): VaultEvent[] {
  try {
    const raw = globalThis.localStorage?.getItem(EVENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? (parsed as VaultEvent[]).filter(
          (e) => typeof e?.vaultId === "string" && typeof e.at === "number"
        )
      : [];
  } catch {
    return [];
  }
}

type Lookup =
  | { kind: "launcher"; id: string; puzzleHash: string }
  | { kind: "address"; address: string; puzzleHash: string }
  | { kind: "invalid"; reason: "checksum" | "format" }
  | null;

function parseLookup(raw: string): Lookup {
  const input = raw.trim().toLowerCase();
  if (!input) return null;
  if (input.startsWith("xch1") || input.startsWith("txch1")) {
    const decoded = decodeBech32m(input);
    if (decoded && (decoded.prefix === "xch" || decoded.prefix === "txch"))
      return { kind: "address", address: input, puzzleHash: decoded.hash };
    return { kind: "invalid", reason: "checksum" };
  }
  const id = normaliseId32(input);
  // A vault's funds sit at a puzzle hash derived from its launcher id (TASK-086).
  if (id) return { kind: "launcher", id, puzzleHash: vaultP2PuzzleHash(id) };
  return { kind: "invalid", reason: "format" };
}

/**
 * Chia Vaults: custody separated from the coins, with passkeys or m-of-n signers and a
 * recovery path that has a clawback window. Coinset has no vault list, so this section
 * offers a lookup (singleton by launcher id, balance by address) and the recovery events the
 * live stream reports; the full directory lives on the community scanner.
 */
export function ChiaVaults() {
  const t = useT(vaultsNs);
  const { client, endpoints, networkConfig } = useSettings();
  const lastVault = useLiveValue("lastVault");
  const [input, setInput] = useState("");
  const [lookup, setLookup] = useState<Lookup>(null);
  const [events, setEvents] = useState<VaultEvent[]>([]);
  useEffect(() => setEvents(loadEvents()), []);
  useEffect(() => {
    if (!lastVault) return;
    setEvents((list) => {
      if (list.some((e) => e.vaultId === lastVault.vaultId && e.at === lastVault.at)) return list;
      const next = [
        {
          vaultId: lastVault.vaultId,
          action: lastVault.action,
          status: lastVault.status,
          txId: lastVault.txId,
          at: lastVault.at,
        },
        ...list,
      ].slice(0, EVENTS_LIMIT);
      try {
        globalThis.localStorage?.setItem(EVENTS_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable: the list still lives for this tab.
      }
      return next;
    });
  }, [lastVault]);

  const network = endpoints.network;
  const singleton = useQuery({
    queryKey: [
      ...queryKeys.chainRoot(network),
      "vaultSingleton",
      lookup?.kind === "launcher" ? lookup.id : "",
    ],
    enabled: lookup?.kind === "launcher" && client.hasIndexed,
    queryFn: ({ signal }) => client.getSingletonInfo((lookup as { id: string }).id, signal),
    retry: false,
  });
  const fundsPuzzleHash =
    lookup?.kind === "launcher" || lookup?.kind === "address" ? lookup.puzzleHash : null;
  const coins = useQuery({
    queryKey: [...queryKeys.chainRoot(network), "vaultCoins", fundsPuzzleHash ?? ""],
    enabled: fundsPuzzleHash !== null,
    queryFn: ({ signal }) =>
      client.getCoinRecordsByPuzzleHash(fundsPuzzleHash as string, false, signal),
    retry: false,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLookup(parseLookup(input));
  };
  const record = singleton.data?.coinRecord as
    | {
        coin?: { puzzle_hash?: string; amount?: unknown };
        confirmed_block_index?: number;
        spent?: boolean;
        timestamp?: number;
      }
    | null
    | undefined;
  const balance = coins.data ? coins.data.reduce((s, c) => s + c.coin.amount, 0n) : null;
  const vaultAddress =
    lookup?.kind === "launcher"
      ? puzzleHashToAddress(lookup.puzzleHash, networkConfig.addressPrefix)
      : null;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <Tooltip text={t("tooltip")} placement="bottom" />
        </div>
        <p className="text-sm text-fg-muted">
          {t.rich("intro", {
            link: (c) => (
              <ExternalLink href={SCANNER} className="text-accent hover:underline">
                {c}
              </ExternalLink>
            ),
          })}
        </p>
      </header>

      <Card>
        <CardHeader title={t("lookup.title")} />
        <CardBody className="flex flex-col gap-3">
          <form
            onSubmit={submit}
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
            aria-label={t("lookup.title")}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("lookup.placeholder")}
              aria-label={t("lookup.inputLabel")}
              className="mono min-w-0 flex-1 rounded-sm border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
            />
            <Button type="submit">{t("lookup.submit")}</Button>
            <Button type="button" variant="ghost" onClick={() => setInput(EXAMPLE.address)}>
              {t("lookup.example")}
            </Button>
          </form>
          {lookup?.kind === "invalid" ? (
            <p className="text-sm text-danger">{t(`invalid.${lookup.reason}`)}</p>
          ) : null}
          {lookup?.kind === "launcher" ? (
            !client.hasIndexed ? (
              <div className="flex flex-col gap-2 text-sm" data-testid="vault-funds">
                <p className="text-fg-muted">{t("lookup.needsCoinset")}</p>
                {coins.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : coins.error ? (
                  <p className="text-danger">{errorMessage(coins.error)}</p>
                ) : (
                  <FundsTiles coins={coins.data ?? []} balance={balance} />
                )}
                {vaultAddress ? (
                  <p className="text-xs text-fg-faint">
                    {t.rich("lookup.vaultAddress", {
                      hash: () => (
                        <Hash
                          value={vaultAddress}
                          href={routes.address(vaultAddress)}
                          head={12}
                          tail={6}
                        />
                      ),
                    })}
                  </p>
                ) : null}
              </div>
            ) : singleton.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : singleton.error ? (
              <p className="text-sm text-danger">{errorMessage(singleton.error)}</p>
            ) : !record?.coin ? (
              <p className="text-sm text-fg-muted">{t("lookup.noSingleton")}</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm" data-testid="vault-singleton">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <StatTile
                    label={t("lookup.singleton")}
                    value={singleton.data?.singletonType ?? t("lookup.singletonFallback")}
                    sub={record.spent ? t("lookup.coinSpent") : t("lookup.coinUnspent")}
                    tone="primary"
                  />
                  <StatTile
                    label={t("lookup.coinSince")}
                    value={
                      record.confirmed_block_index
                        ? `#${formatNumber(record.confirmed_block_index)}`
                        : "—"
                    }
                    sub={record.timestamp ? formatAge(record.timestamp * 1000) : undefined}
                  />
                  <StatTile
                    label={t("lookup.coinAmount")}
                    value={formatAmount(BigInt(String(record.coin.amount ?? 0)))}
                    sub={t("lookup.coinAmountSub")}
                  />
                  <StatTile
                    label={t("lookup.funds")}
                    value={
                      coins.isLoading
                        ? "…"
                        : coins.error || balance === null
                          ? "—"
                          : formatAmount(balance)
                    }
                    sub={
                      coins.error
                        ? t("lookup.fundsError")
                        : coins.data
                          ? t("lookup.unspentCoins", { count: coins.data.length })
                          : undefined
                    }
                    hint={t("lookup.fundsHint")}
                  />
                </div>
                <p className="text-xs text-fg-faint">
                  {t.rich("lookup.launcher", {
                    launcher: () => <Hash value={lookup.id} head={10} tail={6} copy />,
                    funds: () =>
                      vaultAddress ? (
                        <Hash
                          value={vaultAddress}
                          href={routes.address(vaultAddress)}
                          head={10}
                          tail={6}
                        />
                      ) : null,
                    current: () => (
                      <Hash
                        value={puzzleHashToAddress(
                          String(record.coin?.puzzle_hash ?? "").replace(/^0x/, ""),
                          networkConfig.addressPrefix
                        )}
                        head={10}
                        tail={6}
                      />
                    ),
                    scanner: (c) => (
                      <ExternalLink
                        href={`${SCANNER}/vault/${lookup.id}`}
                        className="text-accent hover:underline"
                      >
                        {c}
                      </ExternalLink>
                    ),
                  })}
                </p>
              </div>
            )
          ) : null}
          {lookup?.kind === "address" ? (
            coins.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : coins.error ? (
              <p className="text-sm text-danger">{errorMessage(coins.error)}</p>
            ) : (
              <div className="flex flex-col gap-2 text-sm" data-testid="vault-address">
                <FundsTiles coins={coins.data ?? []} balance={balance} />
                <p className="text-xs text-fg-faint">
                  {lookup.address === EXAMPLE.address ? `${t("exampleLabel")} · ` : ""}
                  {t.rich("lookup.fullHistory", {
                    hash: () => (
                      <Hash
                        value={lookup.address}
                        href={routes.address(lookup.address)}
                        head={12}
                        tail={6}
                      />
                    ),
                  })}
                </p>
              </div>
            )
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("activity.title")}
          action={
            <span className="text-xs text-fg-faint">
              {endpoints.isCoinset ? t("activity.fromStream") : t("activity.needsStream")}
            </span>
          }
        />
        <CardBody>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-faint">{t("activity.empty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border/60 text-sm" aria-live="polite">
              {events.map((e) => (
                <li
                  key={`${e.vaultId}-${e.at}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        e.action === "clawback_recovery"
                          ? "danger"
                          : e.action === "finish_recovery"
                            ? "primary"
                            : "warning"
                      }
                    >
                      {actionLabel(e.action) ? t(actionLabel(e.action)!) : e.action}
                    </Badge>
                    <Hash value={e.vaultId} head={10} tail={6} />
                    {e.txId ? (
                      <Hash
                        value={e.txId}
                        href={routes.tx(e.txId)}
                        head={8}
                        tail={4}
                        className="text-xs"
                      />
                    ) : null}
                    <span className="text-xs text-fg-faint">{e.status}</span>
                  </span>
                  <span className="text-xs text-fg-faint">{formatAge(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </section>
  );
}

function FundsTiles({
  coins,
  balance,
}: {
  coins: readonly { confirmedBlockIndex: number }[];
  balance: bigint | null;
}) {
  const t = useT(vaultsNs);
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <StatTile
        label={t("funds.balance")}
        value={balance !== null ? formatAmount(balance) : "—"}
        tone="primary"
        sub={t("funds.balanceSub")}
      />
      <StatTile label={t("funds.coins")} value={formatNumber(coins.length)} />
      <StatTile
        label={t("funds.newestCoin")}
        value={
          coins.length > 0
            ? `#${formatNumber(Math.max(...coins.map((c) => c.confirmedBlockIndex)))}`
            : "—"
        }
      />
    </div>
  );
}
