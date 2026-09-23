"use client";

import { FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { useT } from "@/shared/i18n/useT";
import type { ColourMode } from "./model";
import { KIND_COLOR } from "./palette";

/** What size, colour and the two markers mean. Tiles carry no text, so this says it all. */
export function GogglesLegend({ colour, kinds }: { colour: ColourMode; kinds: TxKindHint[] }) {
  const t = useT("goggles");
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-fg-faint"
      data-testid="goggles-legend"
    >
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-flex items-end gap-0.5">
          <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-fg-faint" />
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-fg-faint" />
        </span>
        {t("legendSize")}
      </span>
      {colour === "fee" ? (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {t("legendFee")}
          <span className="inline-flex flex-wrap items-center gap-1">
            {FEE_BANDS.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-0.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-[2px]"
                  style={{ background: `var(${b.cssVar})` }}
                />
                <span className="tabular">{b.label}</span>
              </span>
            ))}
            <span>{t("feeUnit")}</span>
          </span>
        </span>
      ) : (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {t("legendKind")}
          {kinds.map((k) => (
            <span key={k} className="inline-flex items-center gap-0.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-[2px]"
                style={{ background: KIND_COLOR[k] }}
              />
              {t(`kinds.${k}`)}
            </span>
          ))}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true" className="goggles-legend-new" />
        {t("legendNew")}
      </span>
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true" className="goggles-legend-yours" />
        {t("legendYours")}
      </span>
    </div>
  );
}
