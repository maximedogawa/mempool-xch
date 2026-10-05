"use client";

import { useMemo } from "react";
import { intlTag } from "@/shared/i18n/active";
import { useLocale, useT } from "@/shared/i18n/useT";
import type { MapRegion } from "@/shared/lib/map/countryPoints";
import { UNMAPPED } from "@/shared/lib/map/stats";
import mapNs from "@/shared/i18n/messages/en/map";

const REGION_KEY = {
  Europe: "europe",
  Asia: "asia",
  "North America": "northAmerica",
  "South America": "southAmerica",
  Africa: "africa",
  Oceania: "oceania",
  [UNMAPPED]: "unmapped",
} as const satisfies Record<MapRegion | typeof UNMAPPED, string>;

/**
 * Display names for the map: regions from the "map" messages, countries in the active language.
 * English keeps the crawler's own label (the tests and the snapshot use it); other languages get
 * the ISO code's name from Intl.DisplayNames, falling back to that label.
 */
export function useMapNames() {
  const t = useT(mapNs);
  const locale = useLocale();
  return useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    if (locale !== "en") {
      try {
        names = new Intl.DisplayNames([intlTag(locale)], { type: "region" });
      } catch {
        names = null;
      }
    }
    const country = (row: { label: string; code: string }): string => {
      if (!names || !/^[A-Z]{2}$/.test(row.code)) return row.label;
      try {
        return names.of(row.code) ?? row.label;
      } catch {
        return row.label;
      }
    };
    const region = (value: MapRegion | typeof UNMAPPED): string =>
      t(`regions.names.${REGION_KEY[value] ?? "unmapped"}`);
    return { country, region };
  }, [t, locale]);
}
