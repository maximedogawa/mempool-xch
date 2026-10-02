"use client";

import Link from "next/link";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { formatCountdown, POTATO } from "@/shared/lib/potato/potato";
import { routes } from "@/shared/lib/routes";
import { useT } from "@/shared/i18n/useT";
import { Card, CardBody, CardHeader, Hash, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { usePotato } from "./usePotato";
import arcadeNs from "@/shared/i18n/messages/en/arcade";

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
  const t = useT(arcadeNs);
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
              text={t("potato.hint", {
                hours,
                price: formatAmount(POTATO.price),
                royalty: formatAmount(POTATO.royalty),
              })}
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
              ? t("potato.live")
              : error
                ? t("potato.unreachable")
                : t("potato.snapshot", { date: snapshotAt })}
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
              {state.ripe ? t("potato.heldLongEnough") : t("potato.untilKeeps")}
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
              {tip.ended
                ? t("potato.roundOver")
                : state.ripe
                  ? t("potato.ripe")
                  : formatCountdown(state.secondsLeft)}
            </div>
            <div className="mt-1 text-xs text-fg-faint">
              {tip.ended
                ? t("potato.ended")
                : state.ripe
                  ? t("potato.ripeNote")
                  : t("potato.deadline", {
                      date: formatDateTime(state.deadlineMs),
                      buffer: POTATO.timelockBufferSeconds,
                    })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              role="meter"
              aria-label={t("potato.meter")}
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
              <span>{t("potato.held", { time: formatCountdown(state.heldSeconds) })}</span>
              <span>{t("potato.hold", { hours })}</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 self-start">
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              {t("potato.inPot")}
            </dt>
            <dd className="tabular text-xl font-semibold text-primary" data-testid="potato-pot">
              {formatAmount(state.pot)}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              {t("potato.snatches")}
            </dt>
            <dd className="tabular text-xl font-semibold" data-testid="potato-snatches">
              {formatNumber(state.snatches)}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              {t("potato.nextCost")}
            </dt>
            <dd className="tabular text-sm font-semibold">{formatAmount(state.nextSnatchCost)}</dd>
            <dd className="text-[11px] text-fg-faint">
              {t("potato.nextCostNote", { price: formatAmount(POTATO.price) })}
            </dd>
          </div>
          <div className="rounded-sm border border-border bg-bg px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
              {t("potato.taken")}
            </dt>
            <dd className="text-sm font-semibold">{formatAge(tip.timestamp * 1000)}</dd>
            <dd className="text-[11px] text-fg-faint">
              {t.rich("potato.inBlock", {
                height: formatNumber(tip.height),
                link: (c) => (
                  <Link href={routes.block(tip.height)} className="text-accent hover:underline">
                    {c}
                  </Link>
                ),
              })}
            </dd>
          </div>
        </dl>
        <p className="text-[11px] text-fg-faint md:col-span-2">
          {t.rich("potato.coinNote", {
            hash: () => (
              <Hash value={tip.coinId} href={routes.coin(tip.coinId)} head={10} tail={6} />
            ),
          })}
        </p>
      </CardBody>
    </Card>
  );
}
