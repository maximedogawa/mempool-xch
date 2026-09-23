"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Volume2, VolumeX, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatEta } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { fetchWalletPending, type WalletCoinRef, type WalletTx } from "@/shared/lib/sage/wallet";
import { useSageCapability } from "@/shared/lib/sage/useCapability";
import { walletPendingKey } from "@/shared/lib/sage/usePendingIds";
import { playCoinChime, primeAudio } from "@/shared/lib/sound/chime";
import {
  describePending,
  EMPTY_TRACKED,
  pendingLine,
  trackPending,
  type PendingStatus,
  type TrackedState,
} from "@/shared/lib/wallet/pendingTracker";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetIcon, Button, Card, CardBody, CardHeader, Hash } from "@/shared/ui";
import { useT } from "@/shared/i18n/useT";
import { kindOf, WalletAmount } from "./amounts";
import walletNs from "@/shared/i18n/messages/en/wallet";

/** Confirmed rows stay on the dashboard this long. */
const KEEP_CONFIRMED_MS = 3 * 60_000;
const MAX_QUEUE_CUBES = 6;

interface Confirmed {
  height: number | null;
  at: number;
  tx: WalletTx | null;
}

/** Small cubes for the projected blocks with the transaction's block lit up. */
function MiniQueue({ status }: { status: PendingStatus }) {
  const count = Math.max(1, Math.min(MAX_QUEUE_CUBES, status.blocksAhead || 1));
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const active = status.phase === "queued" && status.blockIndex === i;
        const beyond = status.phase === "waiting" && i === count - 1;
        return (
          <span
            key={i}
            className={cn(
              "inline-block h-3 w-3 rounded-[3px] border transition-colors",
              active
                ? "animate-pulse border-primary bg-primary shadow-[0_0_8px_var(--primary)]"
                : beyond
                  ? "border-warning/60 bg-[color-mix(in_srgb,var(--warning)_35%,transparent)]"
                  : "border-border bg-surface-2"
            )}
          />
        );
      })}
      {status.phase === "waiting" ? <span className="text-[10px] text-fg-faint">…</span> : null}
    </span>
  );
}

function StatusLine({ status, confirmed }: { status: PendingStatus; confirmed: Confirmed | null }) {
  const t = useT(walletNs);
  if (confirmed) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-primary">
        <CheckCircle2 size={14} aria-hidden="true" />
        {confirmed.height
          ? t.rich("pending.confirmedIn", {
              height: formatNumber(confirmed.height),
              link: (c) => (
                <Link
                  href={routes.block(confirmed.height!)}
                  className="font-semibold hover:underline"
                >
                  {c}
                </Link>
              ),
            })
          : t("pending.confirmed")}
        <span className="text-fg-faint">· {formatAge(confirmed.at)}</span>
      </span>
    );
  }
  const tone =
    status.phase === "broadcast"
      ? "text-warning"
      : status.phase === "waiting"
        ? "text-fg-muted"
        : "text-fg";
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", tone)}>
      {status.phase === "broadcast" ? (
        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
      ) : (
        <MiniQueue status={status} />
      )}
      <span>{pendingLine(status)}</span>
      {status.etaSeconds !== null ? (
        <span className="text-fg-faint">· {formatEta(status.etaSeconds)}</span>
      ) : null}
      {status.feeRate !== null ? (
        <span className="text-fg-faint">
          · {formatFeeRate(status.feeRate)}
          {status.band ? (
            <span
              className="ml-1 rounded-full px-1.5 text-[10px] font-semibold uppercase"
              style={{
                background: `color-mix(in srgb, var(${status.band.cssVar}) 25%, transparent)`,
              }}
            >
              {status.band.label}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function PendingRow({
  tx,
  walletAddress,
  status,
  confirmed,
}: {
  tx: WalletTx;
  walletAddress: string | null;
  status: PendingStatus;
  confirmed: Confirmed | null;
}) {
  const mine = (ref: WalletCoinRef) => ref.address === walletAddress || ref.address === null;
  const received = tx.created.filter(mine);
  const sent = tx.spent.filter(mine);
  const primary = sent[0] ?? received[0];
  const t = useT(walletNs);
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3 py-3 text-sm transition-colors",
        confirmed ? "rounded-sm bg-primary-soft/40 px-2" : ""
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          confirmed ? "bg-primary-soft" : "bg-surface-2"
        )}
      >
        {primary ? (
          <AssetIcon
            kind={kindOf(primary)}
            assetId={primary.assetId ?? undefined}
            iconUrl={primary.iconUrl}
            size={22}
          />
        ) : (
          <Wallet size={18} aria-hidden="true" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">
          {t(
            sent.length && !received.length
              ? "direction.sent"
              : received.length && !sent.length
                ? "direction.received"
                : "direction.transaction"
          )}
          {tx.id ? (
            <>
              {" "}
              <Hash
                value={tx.id}
                href={routes.tx(tx.id)}
                head={6}
                tail={4}
                className="font-normal"
              />
            </>
          ) : null}
          {tx.timestamp ? (
            <span className="font-normal text-fg-faint">
              {" "}
              · {t("pending.submitted", { age: formatAge(tx.timestamp * 1000) })}
            </span>
          ) : null}
        </span>
        <span className="text-xs">
          <StatusLine status={status} confirmed={confirmed} />
        </span>
      </div>
      <span className="tabular ml-auto text-right text-sm">
        {sent.slice(0, 2).map((r, i) => (
          <WalletAmount key={`s${i}`} refItem={r} sign="−" />
        ))}
        {received.slice(0, 2).map((r, i) => (
          <WalletAmount key={`r${i}`} refItem={r} sign="+" />
        ))}
      </span>
    </li>
  );
}

/**
 * Dashboard panel for the connected Sage wallet: every pending transaction with its
 * place in the mempool (projected block, position, ETA, fee band), and a soft coin chime when
 * one lands in a block. Renders nothing outside Sage.
 */
export function WalletPending() {
  const t = useT(walletNs);
  const { inSage, walletAddress } = useSage();
  const { client, endpoints, settings, update } = useSettings();
  const txBatch = useLiveValue("txBatch");
  const lastTxEvent = useLiveValue("lastTxEvent");
  const queryClient = useQueryClient();
  const capability = useSageCapability("wallet.get_pending_transactions");
  const projected = useProjectedBlocks(8);
  const queryKey = useMemo(() => walletPendingKey(endpoints.network), [endpoints.network]);
  const pending = useQuery({
    queryKey,
    enabled: inSage,
    queryFn: fetchWalletPending,
    refetchInterval: 10_000,
  });
  const trackedRef = useRef<TrackedState>(EMPTY_TRACKED);
  const knownRef = useRef(new Map<string, WalletTx>());
  const notifiedRef = useRef(new Set<string>());
  const confirmationController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    confirmationController.current = controller;
    trackedRef.current = EMPTY_TRACKED;
    knownRef.current.clear();
    notifiedRef.current.clear();
    setConfirmed({});
    return () => controller.abort();
  }, [client]);
  const [confirmed, setConfirmed] = useState<Record<string, Confirmed>>({});
  const [, tick] = useState(0);

  // A transaction batch from the live stream usually means our list changed too.
  useEffect(() => {
    if (inSage && txBatch > 0) void queryClient.invalidateQueries({ queryKey });
  }, [inSage, queryClient, queryKey, txBatch]);

  const markConfirmed = useCallback(
    (id: string, height: number | null) => {
      if (notifiedRef.current.has(id)) return;
      notifiedRef.current.add(id);
      setConfirmed((prev) => ({
        ...prev,
        [id]: { height, at: Date.now(), tx: knownRef.current.get(id) ?? null },
      }));
      if (settings.sounds) void playCoinChime(0.5);
    },
    [settings.sounds]
  );

  // Ids that left the wallet's pending list: confirmed (when the index says so) or gone.
  useEffect(() => {
    if (!pending.data) return;
    pending.data.forEach((tx) => {
      if (tx.id) knownRef.current.set(tx.id.toLowerCase(), tx);
    });
    const ids = pending.data.map((t) => t.id).filter((id): id is string => !!id);
    const { state, left } = trackPending(trackedRef.current, ids, Date.now());
    trackedRef.current = state;
    left.forEach((id) => {
      if (notifiedRef.current.has(id)) return;
      if (!client.hasIndexed) {
        markConfirmed(id, null);
        return;
      }
      const signal = confirmationController.current?.signal;
      client
        .getTransaction(id, signal)
        .then((summary) => {
          if (!signal?.aborted) markConfirmed(id, summary.confirmedHeight);
        })
        .catch(() => {
          if (!signal?.aborted) markConfirmed(id, null);
        });
    });
  }, [client, markConfirmed, pending.data]);

  // The live stream may announce the confirmation before the wallet drops the transaction.
  useEffect(() => {
    if (!lastTxEvent || lastTxEvent.status !== "confirmed") return;
    lastTxEvent.ids.forEach((id) => {
      if (trackedRef.current.seen[id]) markConfirmed(id, lastTxEvent.height);
    });
  }, [lastTxEvent, markConfirmed]);

  // Age labels and the 3-minute expiry of confirmed rows.
  useEffect(() => {
    const id = setInterval(() => {
      tick((n) => n + 1);
      setConfirmed((prev) => {
        const now = Date.now();
        const kept = Object.fromEntries(
          Object.entries(prev).filter(([, c]) => now - c.at < KEEP_CONFIRMED_MS)
        );
        const retained = new Set([...Object.keys(trackedRef.current.seen), ...Object.keys(kept)]);
        for (const key of knownRef.current.keys())
          if (!retained.has(key)) knownRef.current.delete(key);
        for (const key of notifiedRef.current)
          if (!retained.has(key)) notifiedRef.current.delete(key);
        return Object.keys(kept).length === Object.keys(prev).length ? prev : kept;
      });
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!inSage) return null;

  const toggleSound = () => {
    primeAudio();
    const next = !settings.sounds;
    update({ sounds: next });
    if (next) void playCoinChime(0.5);
  };

  const rows = pending.data ?? [];
  const confirmedRows = Object.entries(confirmed)
    .filter(([id]) => !rows.some((t) => t.id?.toLowerCase() === id))
    .map(([id, c]) => ({ id, c }))
    .sort((a, b) => b.c.at - a.c.at);
  const items = projected.summary?.items;
  const title = rows.length ? t("pending.titleCount", { count: rows.length }) : t("pending.title");

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={settings.sounds}
              aria-label={settings.sounds ? t("pending.mute") : t("pending.unmute")}
              title={settings.sounds ? t("pending.chimeOn") : t("pending.chimeOff")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-fg-muted hover:text-fg"
            >
              {settings.sounds ? (
                <Volume2 size={14} aria-hidden="true" />
              ) : (
                <VolumeX size={14} aria-hidden="true" />
              )}
            </button>
            <Link href={routes.wallet()} className="text-xs text-accent hover:underline">
              {t("pending.walletLink")}
            </Link>
          </span>
        }
      />
      <CardBody>
        {capability.refused && !capability.granted ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
            <span>{t("pending.allowNotice")}</span>
            <Button size="sm" onClick={() => void capability.enable()}>
              {t("enableInSage")}
            </Button>
          </div>
        ) : rows.length === 0 && confirmedRows.length === 0 ? (
          <p className="py-2 text-center text-sm text-fg-faint">
            {pending.isLoading ? t("pending.reading") : t("pending.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((tx, i) => (
              <PendingRow
                key={tx.id ?? i}
                tx={tx}
                walletAddress={walletAddress}
                status={describePending(tx.id ?? "", items, projected.blocks)}
                confirmed={null}
              />
            ))}
            {confirmedRows.map(({ id, c }) =>
              c.tx ? (
                <PendingRow
                  key={id}
                  tx={c.tx}
                  walletAddress={walletAddress}
                  status={describePending(id, items, projected.blocks)}
                  confirmed={c}
                />
              ) : null
            )}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
