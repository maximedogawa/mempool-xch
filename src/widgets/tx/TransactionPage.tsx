"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useBlockchainState, useProjectedBlocks } from "@/shared/api/hooks";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { feePerCost, formatAmount, formatCat, formatCost, formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { hexToUtf8IfText, shortId } from "@/shared/lib/chia/hex";
import { formatAge, formatDateTime, formatDuration, formatEta } from "@/shared/lib/format/time";
import { classifyMempoolItem } from "@/shared/lib/mempool/classify";
import { bundleAssets } from "@/shared/lib/mempool/compact";
import { findProjectedPosition } from "@/shared/lib/mempool/packing";
import { useBlockPool } from "@/shared/lib/pools/usePoolLookup";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { stringifyJsonSafe } from "@/shared/lib/rpc/json";
import type { AssetAmounts, RawTransaction, TxSummary, TxSummaryEvent } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetAmount, AssetBadge, Button, Card, CardBody, CardHeader, CatRef, EmptyState, Hash, Skeleton, StatTile, StatusBadge, SummaryKindBadge, Tooltip } from "@/shared/ui";
import { useBlock } from "@/widgets/block/useBlock";
import { WatchButton } from "@/widgets/watchlist/WatchButton";
import { collectMemos, flowFromCoins, flowFromEvents } from "./flow";
import { FlowDiagram } from "./FlowDiagram";
import { useRawTransaction, useTransaction } from "./useTransaction";
import { costVerdict, waitedSeconds } from "./verdict";

function RawJson({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader
        title={label}
        action={
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />} {open ? "Hide" : "Show"} raw JSON
          </Button>
        }
      />
      {open ? (
        <CardBody>
          <pre className="mono max-h-[480px] overflow-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted">
            {JSON.stringify(JSON.parse(stringifyJsonSafe(value)), null, 2)}
          </pre>
        </CardBody>
      ) : null}
    </Card>
  );
}

function Memos({ memos }: { memos: string[] }) {
  if (memos.length === 0) return null;
  return (
    <Card>
      <CardHeader title={`Memos (${memos.length})`} />
      <CardBody>
        <ul className="flex flex-col gap-1.5">
          {memos.map((m, i) => {
            const text = hexToUtf8IfText(m);
            return (
              <li key={`${m}-${i}`} className="flex flex-col gap-0.5 rounded-sm border border-border bg-bg px-3 py-2 text-sm">
                {text ? <span className="break-words">{text}</span> : <span className="text-fg-faint">binary memo (likely a hint or puzzle hash)</span>}
                <Hash value={m} full={m.length <= 64} head={12} tail={8} copy className="text-xs text-fg-faint" />
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

function AssetList({ amounts }: { amounts: AssetAmounts }) {
  const parts: React.ReactNode[] = [];
  if (amounts.xch !== 0n) parts.push(<span key="xch">{formatAmount(amounts.xch)}</span>);
  amounts.cats.forEach((c) =>
    parts.push(
      <CatRef key={c.assetId} assetId={c.assetId} amountText={formatCat(c.amount)} />
    )
  );
  amounts.nfts.forEach((n) =>
    parts.push(
      <span key={n} className="inline-flex items-center gap-1">
        NFT <Hash value={n} href={routes.nft(n)} head={4} tail={4} />
      </span>
    )
  );
  if (parts.length === 0) return <span className="text-fg-faint">—</span>;
  return <span className="flex flex-wrap gap-x-2 gap-y-0.5">{parts}</span>;
}

const MAX_PARTICIPANTS = 50;

function EventCard({ event, index }: { event: TxSummaryEvent; index: number }) {
  const { networkConfig } = useSettings();
  const raw = event.raw;
  const participants = event.participants.slice(0, MAX_PARTICIPANTS);
  const legs = Array.isArray(raw.legs) ? (raw.legs as { p2?: string; sent?: unknown; received?: unknown }[]) : [];
  const minted = raw.minted && typeof raw.minted === "object" ? (raw.minted as { asset_type?: string; asset_id?: string; amount?: string }) : null;
  const melted = raw.melted && typeof raw.melted === "object" ? (raw.melted as { asset_type?: string; asset_id?: string; amount?: string }) : null;
  const amm = raw.amm && typeof raw.amm === "object" ? (raw.amm as { protocol?: string }) : null;
  const addr = (p2: string) => {
    const ph = p2.replace(/^0x/, "");
    try {
      return puzzleHashToAddress(ph, networkConfig.addressPrefix);
    } catch {
      return ph;
    }
  };
  return (
    <div className="rounded-sm border border-border bg-bg p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-fg-faint">Event {index + 1}</span>
        <span className="font-semibold">{event.type}</span>
        {amm?.protocol ? <span className="text-xs text-fg-faint">via {amm.protocol}</span> : null}
        {typeof raw.action === "string" ? <span className="text-xs text-fg-faint">{raw.action}</span> : null}
      </div>
      {event.participants.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-fg-muted">
              <th className="py-1 font-semibold">Participant</th>
              <th className="py-1 font-semibold">Sent</th>
              <th className="py-1 font-semibold">Received</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.p2} className="border-t border-border/60 align-top">
                <td className="py-1.5 pr-2">
                  <Hash value={addr(p.p2)} href={routes.address(addr(p.p2))} head={8} tail={5} />
                </td>
                <td className="py-1.5 pr-2 text-danger">
                  <AssetList amounts={p.sent} />
                </td>
                <td className="py-1.5 text-primary">
                  <AssetList amounts={p.received} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {event.participants.length > participants.length ? (
        <p className="mt-1 text-xs text-fg-faint">…and {event.participants.length - participants.length} more participants (see raw JSON).</p>
      ) : null}
      {legs.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {legs.map((leg, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <span className="text-fg-faint">Leg {i + 1}</span>
              {leg.p2 ? <Hash value={addr(leg.p2)} href={routes.address(addr(leg.p2))} head={6} tail={4} /> : null}
              <span className="text-xs text-fg-faint">sent</span> <span className="text-danger">{JSON.stringify(leg.sent)}</span>
              <span className="text-xs text-fg-faint">received</span> <span className="text-primary">{JSON.stringify(leg.received)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {minted ? (
        <p className="mt-2 text-sm">
          Minted {minted.asset_type?.toUpperCase()}{" "}
          {minted.asset_id && minted.asset_type !== "nft" ? (
            <CatRef assetId={minted.asset_id} amountText={minted.amount ? formatCat(BigInt(minted.amount)) : undefined} showId />
          ) : minted.asset_id ? (
            <Hash value={minted.asset_id} href={routes.nft(minted.asset_id.replace(/^0x/, ""))} head={6} tail={4} />
          ) : null}
        </p>
      ) : null}
      {melted ? (
        <p className="mt-2 text-sm">
          Melted {melted.asset_type?.toUpperCase()}{" "}
          {melted.asset_id && melted.asset_type !== "nft" ? (
            <CatRef assetId={melted.asset_id} amountText={melted.amount ? formatCat(BigInt(melted.amount)) : undefined} showId />
          ) : melted.asset_id ? (
            <Hash value={melted.asset_id} head={6} tail={4} />
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function SemanticSummary({ summary }: { summary: TxSummary }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Summary <SummaryKindBadge kind={summary.kind} />
            <Tooltip text="Semantic interpretation provided by the Coinset indexer: who sent and received which assets." />
          </span>
        }
      />
      <CardBody className="flex flex-col gap-2">
        {summary.events.length === 0 ? <p className="text-sm text-fg-faint">No semantic events for this transaction.</p> : summary.events.map((e, i) => <EventCard key={i} event={e} index={i} />)}
      </CardBody>
    </Card>
  );
}

export function TransactionPage({ id }: { id: string | null }) {
  const { endpoints, networkConfig } = useSettings();
  const tx = useTransaction(id);
  const state = useBlockchainState();
  const projected = useProjectedBlocks(8);
  const position = useMemo(() => (id ? findProjectedPosition(projected.blocks, id) : null), [projected.blocks, id]);
  // Called unconditionally (rules of hooks): the confirming block, once known, for "farmed by".
  const confirmedHeight = tx.data && tx.data.status !== "pending" && tx.data.status !== "not_found" ? tx.data.summary.confirmedHeight : null;
  const confirmedBlock = useBlock(confirmedHeight !== null ? String(confirmedHeight) : "");
  const farmedBy = useBlockPool(confirmedBlock.data?.record);
  const settled = !!tx.data && (tx.data.status === "confirmed" || tx.data.status === "removed");
  const raw = useRawTransaction(id, settled);

  if (!id) {
    return <EmptyState title="No transaction id" description="Open a transaction from the dashboard or paste an id into the search box." />;
  }
  if (tx.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (tx.error) {
    return <EmptyState tone="danger" title="Could not load the transaction" description={errorMessage(tx.error)} action={<Button onClick={() => tx.refetch()}>Retry</Button>} />;
  }
  const view = tx.data;
  if (!view || view.status === "not_found") {
    return (
      <div className="flex flex-col gap-4">
        <Heading id={id} status="unknown" />
        <EmptyState
          title="Transaction not found"
          description={
            <>
              No pending spend bundle with this id is in the mempool{endpoints.isCoinset ? " and Coinset has no confirmed or dropped transaction with it" : ""}. Spend bundles that were dropped from the mempool without confirming are not retained by nodes, so they cannot be shown.
              {!endpoints.isCoinset ? " Confirmed transaction lookups need a Coinset endpoint; with a custom node, search the coin ids instead." : ""}
            </>
          }
        />
      </div>
    );
  }

  if (view.status === "pending") {
    const { item } = view;
    const rate = feePerCost(item.fee, item.cost);
    const flow = flowFromCoins(item.removals, item.additions, view.kind, view.assetIds);
    const memos = view.summary ? collectMemos(view.summary.events) : [];
    return (
      <div className="flex flex-col gap-4">
        <Heading id={id} status="pending" kind={<AssetBadge kind={view.kind} assetId={view.assetIds[0]} />} />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatTile label="Fee" value={formatAmount(item.fee)} sub={item.fee === 0n ? "0-fee spend" : `${item.fee.toString()} mojo`} tone={item.fee === 0n ? "default" : "primary"} />
          <StatTile label="Cost" value={formatCost(item.cost)} sub={`${formatNumber(item.cost)} CLVM cost`} hint="Total CLVM cost of the spend bundle; blocks hold 11B cost." />
          <StatTile label="Fee / cost" value={`${formatFeeRate(rate)}`} sub="mojo per cost" />
          <StatTile
            label="Projected block"
            value={position ? `#${position.block.index + 1}` : projected.isLoading ? "…" : "n/a"}
            sub={position ? `${formatEta(position.block.etaSeconds)} · position ${position.position + 1} of ${position.block.items.length}` : "not in the summarised mempool yet"}
            tone="primary"
            hint="Where this bundle lands when the mempool is packed by fee per cost into 11B-cost blocks."
          />
        </div>
        <p className="text-xs text-fg-faint">
          {item.spendBundle.coinSpends.length} coin spend{item.spendBundle.coinSpends.length === 1 ? "" : "s"} · {item.removals.length} removals → {item.additions.length} additions · spends <AssetAmount assets={bundleAssets(item)} kind={view.kind} full />
          {view.assetIds.length > 0 ? (
            <>
              {" "}
              · asset{view.assetIds.length > 1 ? "s" : ""}{" "}
              {view.assetIds.map((a) =>
                view.kind === "cat" ? <CatRef key={a} assetId={a} showId className="ml-1" /> : <Hash key={a} value={a} href={routes.nft(a)} head={6} tail={4} className="ml-1" />
              )}
            </>
          ) : null}
          {" · "}updates live; refreshes every 10 s while pending.
        </p>
        <Card>
          <CardHeader title="Coins" />
          <CardBody>
            <FlowDiagram flow={flow} fee={item.fee} />
          </CardBody>
        </Card>
        {view.summary ? <SemanticSummary summary={view.summary} /> : null}
        <Memos memos={memos} />
        <RawJson label="Spend bundle" value={{ spend_bundle_name: item.name, fee: item.fee, cost: item.cost, spend_bundle: item.spendBundle, additions: item.additions, removals: item.removals }} />
      </div>
    );
  }

  const { summary } = view;
  const peak = state.data?.peak.height ?? null;
  const confirmations = summary.confirmedHeight !== null && peak !== null ? Math.max(0, peak - summary.confirmedHeight + 1) : null;
  const flow = flowFromEvents(summary.events);
  const rate = feePerCost(summary.feeMojos, summary.cost);
  const blockMaxCost = state.data?.blockMaxCost ?? 11_000_000_000;
  const verdict = costVerdict(summary.feeMojos, summary.cost, blockMaxCost);
  const endMs = summary.confirmedAtMs ?? summary.removedAtMs;
  const waited = waitedSeconds(summary.firstSeenMs, endMs);
  const record = confirmedBlock.data?.record;
  const poolEntry = farmedBy.entry;
  const soloFarmer = farmedBy.bothShares || (farmedBy.claim?.selfPooled ?? false);
  return (
    <div className="flex flex-col gap-4">
      <Heading id={id} status={view.status} kind={<SummaryKindBadge kind={summary.kind} />} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile
          label={view.status === "removed" ? "Dropped" : "Block"}
          value={
            summary.confirmedHeight !== null ? (
              <Link href={routes.block(summary.confirmedHeight)} className="text-accent hover:underline">
                {formatNumber(summary.confirmedHeight)}
              </Link>
            ) : (
              "—"
            )
          }
          sub={confirmations !== null ? `${formatNumber(confirmations)} confirmation${confirmations === 1 ? "" : "s"}` : view.status === "removed" ? "removed from the mempool" : undefined}
          tone={view.status === "removed" ? "danger" : "primary"}
        />
        <StatTile
          label="Time"
          value={summary.confirmedAtMs ? formatAge(summary.confirmedAtMs) : summary.removedAtMs ? formatAge(summary.removedAtMs) : "—"}
          sub={summary.confirmedAtMs ? formatDateTime(summary.confirmedAtMs) : summary.removedAtMs ? formatDateTime(summary.removedAtMs) : undefined}
        />
        <StatTile label="Fee" value={formatAmount(summary.feeMojos)} sub={summary.cost > 0 ? `${formatFeeRate(rate)} mojo / cost` : undefined} />
        <StatTile label="Cost" value={summary.cost > 0 ? formatCost(summary.cost) : "n/a"} sub={summary.source === "inferred" ? "inferred from chain (no cost recorded)" : `${formatNumber(summary.cost)} CLVM cost`} />
        <StatTile label="Verdict" value={verdict.label} sub={verdict.detail} tone={summary.feeMojos === 0n ? "default" : "primary"} />
      </div>
      {summary.confirmedHeight !== null ? (
        <div className="text-xs text-fg-faint" data-testid="farmed-by">
          Farmed by{" "}
          {record ? (
            poolEntry ? (
              <a href={poolEntry.url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                {poolEntry.name}
              </a>
            ) : soloFarmer ? (
              <span className="text-fg-muted">an unidentified solo farmer</span>
            ) : (
              <>
                an unidentified pool at{" "}
                <Hash value={puzzleHashToAddress(record.poolPuzzleHash, networkConfig.addressPrefix)} href={routes.address(puzzleHashToAddress(record.poolPuzzleHash, networkConfig.addressPrefix))} head={8} tail={5} />
              </>
            )
          ) : confirmedBlock.isLoading ? (
            "…"
          ) : (
            "unknown"
          )}
          {" · "}
          <Link href={routes.block(summary.confirmedHeight)} className="text-accent hover:underline">
            block details
          </Link>
        </div>
      ) : null}
      {summary.firstSeenMs ? (
        <p className="text-xs text-fg-faint">
          First seen in the mempool {formatAge(summary.firstSeenMs)} ({formatDateTime(summary.firstSeenMs)}).
          {waited !== null ? (
            <>
              {" "}
              Waited {formatDuration(waited)} before {view.status === "removed" ? "being removed" : "confirming"} — based on a first-seen sample, not a
              consensus fact.
            </>
          ) : null}
        </p>
      ) : null}
      <SemanticSummary summary={summary} />
      <Card>
        <CardHeader title="Coins" />
        <CardBody>
          <FlowDiagram flow={flow} fee={summary.feeMojos} />
        </CardBody>
      </Card>
      {raw.data ? <CoinSpends raw={raw.data} /> : null}
      <Memos memos={collectMemos(summary.events)} />
      <RawJson label="Transaction summary" value={{ ...summary, events: summary.events.map((e) => e.raw) }} />
      {raw.data ? <RawJson label="Spend bundle" value={{ source: raw.data.source, spend_bundle_name: raw.data.item.name, fee: raw.data.item.fee, cost: raw.data.item.cost, spend_bundle: raw.data.item.spendBundle, additions: raw.data.item.additions, removals: raw.data.item.removals }} /> : null}
    </div>
  );
}

/**
 * Coin-level view of a settled bundle from get_raw_transaction_by_id: the exact coins spent
 * and created, which the semantic summary above folds into per-participant flows.
 */
function CoinSpends({ raw }: { raw: RawTransaction }) {
  const { item, source } = raw;
  const { kind, assetIds } = classifyMempoolItem(item);
  const flow = flowFromCoins(item.removals, item.additions, kind, assetIds);
  return (
    <Card>
      <CardHeader
        title={`Coin spends (${item.spendBundle.coinSpends.length})`}
        action={
          <span className="inline-flex items-center gap-2 text-[11px] text-fg-faint">
            <AssetBadge kind={kind} assetId={assetIds[0]} />
            {source === "inferred" ? <Tooltip text="Coinset never saw this bundle in the mempool; the spends are rebuilt from the block it landed in, so fee and cost are what the block records." /> : null}
          </span>
        }
      />
      <CardBody className="flex flex-col gap-2">
        <p className="text-xs text-fg-faint">
          {item.removals.length} coin{item.removals.length === 1 ? "" : "s"} spent → {item.additions.length} created · {formatCost(item.cost)} cost · spends <AssetAmount assets={bundleAssets(item)} kind={kind} full />
          {source === "inferred" ? " · rebuilt from the block" : " · as seen in the mempool"}
        </p>
        <FlowDiagram flow={flow} fee={item.fee} />
      </CardBody>
    </Card>
  );
}

function Heading({ id, status, kind }: { id: string; status: "pending" | "confirmed" | "removed" | "unknown"; kind?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Transaction</h1>
          <StatusBadge status={status} />
          {kind}
        </div>
        <WatchButton kind="tx" id={id} label={shortId(id)} />
      </div>
      <Hash value={id} full copy className="text-sm text-fg-muted" />
    </header>
  );
}
