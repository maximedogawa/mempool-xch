"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { decodeBech32m, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { useLive } from "@/shared/providers/LiveProvider";
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

const SCANNER = "https://vaults.xchplorer.com";
const EVENTS_KEY = "mempool-xch:vault-events:v1";
const EVENTS_LIMIT = 30;

/** A Chia Vault everyone can check against: Chia Network's "Buy XCH" hot wallet (xch.ninja labels it; the scanner shows it as its largest vault). */
const EXAMPLE = {
  launcherId: "a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201",
  address: "xch1lv34uumcyg892zrv35rhrx87hu5nx87em7zcag5nc2vjecupkdzspc9xn6",
  label: "Chia Network's Buy XCH hot wallet",
};

interface VaultEvent {
  vaultId: string;
  action: string;
  status: string;
  txId: string | null;
  at: number;
}

const ACTION_LABEL: Record<string, string> = {
  initiate_recovery: "Recovery started",
  finish_recovery: "Recovery finished",
  clawback_recovery: "Recovery clawed back",
};

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
  | { kind: "launcher"; id: string }
  | { kind: "address"; address: string; puzzleHash: string }
  | { kind: "invalid"; reason: string }
  | null;

function parseLookup(raw: string): Lookup {
  const input = raw.trim().toLowerCase();
  if (!input) return null;
  if (input.startsWith("xch1") || input.startsWith("txch1")) {
    const decoded = decodeBech32m(input);
    if (decoded && (decoded.prefix === "xch" || decoded.prefix === "txch"))
      return { kind: "address", address: input, puzzleHash: decoded.hash };
    return { kind: "invalid", reason: "That looks like an address but its checksum is wrong." };
  }
  const id = normaliseId32(input);
  if (id) return { kind: "launcher", id };
  return {
    kind: "invalid",
    reason: "Paste a vault launcher id (64 hex characters) or the vault's xch address.",
  };
}

/**
 * Chia Vaults: custody separated from the coins, with passkeys or m-of-n signers and a
 * recovery path that has a clawback window. Coinset has no vault list, so this section
 * offers a lookup (singleton by launcher id, balance by address) and the recovery events the
 * live stream reports; the full directory lives on the community scanner.
 */
export function ChiaVaults() {
  const { client, endpoints, networkConfig } = useSettings();
  const { lastVault } = useLive();
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
  const coins = useQuery({
    queryKey: [
      ...queryKeys.chainRoot(network),
      "vaultCoins",
      lookup?.kind === "address" ? lookup.puzzleHash : "",
    ],
    enabled: lookup?.kind === "address",
    queryFn: ({ signal }) =>
      client.getCoinRecordsByPuzzleHash(
        (lookup as { puzzleHash: string }).puzzleHash,
        false,
        signal
      ),
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

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Chia Vaults</h2>
          <Tooltip
            text="A Chia Vault keeps the right to spend outside the coins: a passkey, hardware key or m-of-n signers control a singleton, and a recovery path lets the owner regain access after a delay the vault can claw back. Coinset streams recovery steps but has no vault directory; the scanner linked below indexes all of them."
            placement="bottom"
          />
        </div>
        <p className="text-sm text-fg-muted">
          Look a vault up by its launcher id or its address, or browse them all on the{" "}
          <ExternalLink href={SCANNER} className="text-accent hover:underline">
            community vault scanner
          </ExternalLink>
          .
        </p>
      </header>

      <Card>
        <CardHeader title="Vault lookup" />
        <CardBody className="flex flex-col gap-3">
          <form
            onSubmit={submit}
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
            aria-label="Vault lookup"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Vault launcher id or xch address"
              aria-label="Vault launcher id or address"
              className="mono min-w-0 flex-1 rounded-sm border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
            />
            <Button type="submit">Look up</Button>
            <Button type="button" variant="ghost" onClick={() => setInput(EXAMPLE.address)}>
              Try an example
            </Button>
          </form>
          {lookup?.kind === "invalid" ? (
            <p className="text-sm text-danger">{lookup.reason}</p>
          ) : null}
          {lookup?.kind === "launcher" ? (
            !client.hasIndexed ? (
              <p className="text-sm text-fg-muted">
                Singleton lookups by launcher id need Coinset; with a custom node paste the
                vault&apos;s address instead.
              </p>
            ) : singleton.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : singleton.error ? (
              <p className="text-sm text-danger">{errorMessage(singleton.error)}</p>
            ) : !record?.coin ? (
              <p className="text-sm text-fg-muted">
                Coinset knows no singleton with this launcher id.
              </p>
            ) : (
              <div className="flex flex-col gap-2 text-sm" data-testid="vault-singleton">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <StatTile
                    label="Singleton"
                    value={singleton.data?.singletonType ?? "singleton"}
                    sub={record.spent ? "current coin spent" : "current coin unspent"}
                    tone="primary"
                  />
                  <StatTile
                    label="Current coin since"
                    value={
                      record.confirmed_block_index
                        ? `#${formatNumber(record.confirmed_block_index)}`
                        : "—"
                    }
                    sub={record.timestamp ? formatAge(record.timestamp * 1000) : undefined}
                  />
                  <StatTile
                    label="Coin amount"
                    value={formatAmount(BigInt(String(record.coin.amount ?? 0)))}
                    sub="the singleton itself, not the vault's funds"
                  />
                  <StatTile
                    label="Funds"
                    value="—"
                    sub="need the vault address"
                    hint="A vault's coins sit at a puzzle hash derived from the launcher id by the vault puzzle, which this app cannot compute yet (TASK-086). Paste the vault address, or open it on the scanner."
                  />
                </div>
                <p className="text-xs text-fg-faint">
                  Launcher <Hash value={lookup.id} head={10} tail={6} copy /> · current coin at{" "}
                  <Hash
                    value={puzzleHashToAddress(
                      String(record.coin.puzzle_hash ?? "").replace(/^0x/, ""),
                      networkConfig.addressPrefix
                    )}
                    head={10}
                    tail={6}
                  />{" "}
                  ·{" "}
                  <ExternalLink
                    href={`${SCANNER}/vault/${lookup.id}`}
                    className="text-accent hover:underline"
                  >
                    open on the scanner
                  </ExternalLink>
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
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <StatTile
                    label="Balance"
                    value={balance !== null ? formatAmount(balance) : "—"}
                    tone="primary"
                    sub="unspent coins at this address"
                  />
                  <StatTile label="Coins" value={formatNumber(coins.data?.length ?? 0)} />
                  <StatTile
                    label="Newest coin"
                    value={
                      coins.data && coins.data.length > 0
                        ? `#${formatNumber(Math.max(...coins.data.map((c) => c.confirmedBlockIndex)))}`
                        : "—"
                    }
                  />
                </div>
                <p className="text-xs text-fg-faint">
                  {lookup.address === EXAMPLE.address ? `${EXAMPLE.label} · ` : ""}
                  <Hash
                    value={lookup.address}
                    href={routes.address(lookup.address)}
                    head={12}
                    tail={6}
                  />{" "}
                  · full history on the address page.
                </p>
              </div>
            )
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Recovery activity"
          action={
            <span className="text-xs text-fg-faint">
              {endpoints.isCoinset ? "from Coinset's vault stream" : "needs the Coinset stream"}
            </span>
          }
        />
        <CardBody>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-faint">
              No vault recovery seen on this connection yet. Recoveries are rare; events stay listed
              here across visits once one arrives.
            </p>
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
                      {ACTION_LABEL[e.action] ?? e.action}
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
