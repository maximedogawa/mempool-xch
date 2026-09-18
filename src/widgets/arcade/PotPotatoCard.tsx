"use client";

import Link from "next/link";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { formatCountdown, POTATO } from "@/shared/lib/potato/potato";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader, Hash, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { usePotato } from "./usePotato";

/** Fuse colour moves from calm green to hot red as the hold runs down. */
function fuseTone(progress: number): string {
  if (progress >= 0.9) return "var(--fee-5)";
  if (progress >= 0.66) return "var(--fee-4)";
  if (progress >= 0.33) return "var(--fee-3)";
  return "var(--primary)";
}

/**
 * The one clock on the site that counts down: how long until the current holder keeps the
 * whole pot. Snatching before that resets it; after it nothing happens on chain, the pot is
 * simply the holder's XCH.
 */
export function PotPotatoCard() {
  const { tip, state, live, error, snapshotAt } = usePotato();
  const tone = state.ripe ? "var(--primary)" : fuseTone(state.progress);
  const hours = POTATO.holdSeconds / 3600;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Pot Potato
            <Tooltip
              text={`A hot-potato game entirely on chain: whoever holds the potato coin for ${hours} hours keeps the pot. Anyone can snatch it before that by paying ${formatAmount(POTATO.price)} into the pot plus ${formatAmount(POTATO.royalty)} to every previous holder. The state here is read from the coin lineage on Coinset, nothing else.`}
            />
          </span>
        }
        action={
          <span className="flex items-center gap-2 text-xs text-fg-faint">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                live ? "bg-primary" : "bg-fg-faint"
              )}
              aria-hidden="true"
            />
            {live
              ? "following the coin live"
              : error
                ? "Coinset unreachable, showing the snapshot"
                : `snapshot ${snapshotAt}`}
            <ExternalLink href={POTATO.site} className="text-accent hover:underline">
              potpotato.xyz
            </ExternalLink>
          </span>
        }
      />
      <CardBody className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {state.ripe ? "Held long enough" : "Until the holder keeps it all"}
            </div>
            <div
              className={cn(
                "mono text-5xl font-semibold leading-none tracking-tight sm:text-6xl",
                state.ripe && "text-primary"
              )}
              style={{ color: state.ripe ? undefined : tone }}
              data-testid="potato-clock"
              aria-live="off"
            >
              {tip.ended ? "round over" : state.ripe ? "ripe" : formatCountdown(state.secondsLeft)}
            </div>
            <div className="mt-1 text-xs text-fg-faint">
              {tip.ended
                ? "The potato was claimed or pushed through; the round has ended."
                : state.ripe
                  ? "The deadline passed: the pot is the holder's XCH now, nothing to claim."
                  : `deadline ${formatDateTime(state.deadlineMs)} · give or take ${POTATO.timelockBufferSeconds} s, the snatch's own timestamp decides`}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              role="meter"
              aria-label="Share of the hold already served"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress * 100)}
              className="relative h-3 w-full overflow-hidden rounded-full border border-border bg-bg"
            >
              <div
                className="capacity-fill absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.max(state.progress > 0 ? 1 : 0, state.progress * 100)}%`,
                  background: tone,
                }}
              >
                <div aria-hidden="true" className="capacity-sheen absolute inset-0" />
              </div>
              {[0.25, 0.5, 0.75].map((m) => (
                <span
                  key={m}
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-bg/70"
                  style={{ left: `${m * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-fg-faint">
              <span>held {formatCountdown(state.heldSeconds)}</span>
              <span>{hours} h hold</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 self-start">
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              In the pot
            </dt>
            <dd className="tabular text-xl font-semibold text-primary" data-testid="potato-pot">
              {formatAmount(state.pot)}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              Snatches
            </dt>
            <dd className="tabular text-xl font-semibold" data-testid="potato-snatches">
              {formatNumber(state.snatches)}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              Next snatch costs
            </dt>
            <dd className="tabular text-sm font-semibold">{formatAmount(state.nextSnatchCost)}</dd>
            <dd className="text-[11px] text-fg-faint">
              {formatAmount(POTATO.price)} into the pot + royalties
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              Taken
            </dt>
            <dd className="text-sm font-semibold">{formatAge(tip.timestamp * 1000)}</dd>
            <dd className="text-[11px] text-fg-faint">
              in block{" "}
              <Link href={routes.block(tip.height)} className="text-accent hover:underline">
                #{formatNumber(tip.height)}
              </Link>
            </dd>
          </div>
        </dl>
        <p className="text-[11px] text-fg-faint md:col-span-2">
          Potato coin <Hash value={tip.coinId} href={routes.coin(tip.coinId)} head={10} tail={6} />{" "}
          · the holder is wrapped in a clawback, so the chain shows a merkle root rather than an
          address.
        </p>
      </CardBody>
    </Card>
  );
}
