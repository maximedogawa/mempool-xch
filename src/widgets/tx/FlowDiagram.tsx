"use client";

import { ArrowRight } from "lucide-react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetBadge, Hash } from "@/shared/ui";
import type { Flow, FlowCoin } from "./flow";

const MAX_ROWS = 60;

function CoinRow({ coin, share }: { coin: FlowCoin; share: number }) {
  const { networkConfig } = useSettings();
  const owner = coin.custodyP2 || coin.puzzleHash;
  const address = safeAddress(owner, networkConfig.addressPrefix);
  const amount =
    coin.kind === "cat" ? `${formatCat(coin.amount)} CAT` : coin.kind === "nft" || coin.kind === "did" || coin.kind === "singleton" ? `${coin.amount.toString()} mojo` : formatAmount(coin.amount);
  return (
    <li className="relative flex flex-col gap-1 overflow-hidden rounded-sm border border-border bg-bg px-3 py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${Math.round(share * 100)}%` }} aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-2">
        <Hash value={address ?? owner} href={routes.address(address ?? owner)} head={10} tail={6} />
        <span className="tabular shrink-0 text-sm font-semibold">{amount}</span>
      </div>
      <div className="relative flex items-center justify-between gap-2 text-xs text-fg-faint">
        <span className="inline-flex items-center gap-1.5">
          <AssetBadge kind={coin.kind} assetId={coin.assetId} />
          {coin.assetId ? (
            <Hash value={coin.assetId} href={coin.kind === "cat" ? routes.cat(coin.assetId) : routes.nft(coin.assetId)} head={6} tail={4} />
          ) : null}
        </span>
        {coin.coinId ? (
          <span>
            coin <Hash value={coin.coinId} href={routes.coin(coin.coinId)} head={6} tail={4} />
          </span>
        ) : null}
      </div>
    </li>
  );
}

function safeAddress(puzzleHash: string, prefix: "xch" | "txch"): string | null {
  try {
    return puzzleHashToAddress(puzzleHash, prefix);
  } catch {
    return null;
  }
}

function Column({ title, coins, total }: { title: string; coins: FlowCoin[]; total: bigint }) {
  const shown = coins.slice(0, MAX_ROWS);
  // Bar width relative to the largest amount in this column, so the eye reads size at a glance
  // (mempool.space style); each column scales against its own max, since inputs and outputs can
  // differ widely in size and mixing asset kinds on one scale would be misleading.
  const max = shown.reduce((m, c) => (c.amount > m ? c.amount : m), 0n);
  const shareOf = (amount: bigint) => (max > 0n ? Number(amount) / Number(max) : 0);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
          {title} <span className="text-fg-faint">({coins.length})</span>
        </h3>
        <span className="tabular text-xs text-fg-faint">{formatAmount(total)}</span>
      </div>
      {coins.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border px-3 py-4 text-center text-xs text-fg-faint">None</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {shown.map((c, i) => (
            <CoinRow key={`${c.coinId || c.puzzleHash}-${i}`} coin={c} share={shareOf(c.amount)} />
          ))}
        </ul>
      )}
      {coins.length > shown.length ? <p className="text-xs text-fg-faint">…and {coins.length - shown.length} more (see raw JSON).</p> : null}
    </div>
  );
}

/** Inputs (removals) → outputs (additions), mempool.space style, stacked on phones. */
export function FlowDiagram({ flow, fee }: { flow: Flow; fee: bigint }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <Column title="Inputs · removals" coins={flow.inputs} total={flow.totalIn} />
      <div className="flex items-center justify-center md:pt-8" aria-hidden="true">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-primary">
          <ArrowRight size={16} className="rotate-90 md:rotate-0" />
        </span>
      </div>
      <Column title="Outputs · additions" coins={flow.outputs} total={flow.totalOut} />
      <p className="sr-only">
        {flow.inputs.length} inputs totalling {formatAmount(flow.totalIn)} flow into {flow.outputs.length} outputs totalling {formatAmount(flow.totalOut)}; fee {formatAmount(fee)}. Input {shortId(flow.inputs[0]?.coinId ?? "")}.
      </p>
    </div>
  );
}
