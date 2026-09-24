"use client";

import { LOCALE_NAMES, LOCALES, type Locale } from "@/shared/i18n/config";
import { useLocale, useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { useSettings } from "@/shared/providers/SettingsProvider";
import shellNs from "@/shared/i18n/messages/en/shell";

/**
 * Compact header language picker: shows only the short code (DE), the full names live in the
 * dropdown. The choice persists in settings and applies without a reload.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { update } = useSettings();
  const locale = useLocale();
  const t = useT(shellNs);
  return (
    <label
      className={cn(
        "relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[11px] font-semibold uppercase text-fg-muted focus-within:ring-2 focus-within:ring-primary hover:bg-surface-2 hover:text-fg",
        className
      )}
      title={t("language")}
    >
      <span aria-hidden="true">{locale}</span>
      <select
        value={locale}
        onChange={(e) => update({ locale: e.target.value as Locale })}
        aria-label={t("language")}
        data-testid="language-switch"
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
      >
        {LOCALES.map((id) => (
          <option key={id} value={id} lang={id}>
            {id.toUpperCase()} · {LOCALE_NAMES[id]}
          </option>
        ))}
      </select>
    </label>
  );
}
